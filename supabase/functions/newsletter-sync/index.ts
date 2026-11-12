import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Keeps app users in step with the newsletter's contact list in Resend.
// The newsletter itself is a Resend broadcast (one per language segment,
// topic "Nyhetsbrev / Newsletter"), so app users and external sign-ups get
// the same email. Contact property `source` ("app" | "external") records
// where a contact first came from and is never overwritten, so an external
// sign-up who later joins the app stays "external".
//
// Calls:
// - From Postgres via pg_net (x-internal-secret), on profile / auth.users
//   changes: { type: "upsert_user", userId } | { type: "email_changed",
//   userId, oldEmail } | { type: "delete_email", email } | { type: "backfill",
//   offset?, limit? } | { type: "import_external", rows }.
// - From Resend's webhook (Svix-signed): contact.topics.updated /
//   contact.updated. An unsubscribe in the email lands back in the app's
//   notification_preferences.email_newsletter, so the Settings switch and
//   Resend never disagree. Writes only when the value differs, which also
//   stops the echo of our own topic PATCH from looping.
//
// Staging and production share one Resend account, and Resend keeps one
// contact per email address. So staging (any project but production's)
// uses its own segments + topic, writes no custom properties, and never
// deletes a contact -- it only leaves its own segments. In production a
// deleted account's contact is deleted, whatever its source.

const RESEND = "https://api.resend.com";
// Resend topic + language segments per environment (ids, not secrets).
const LISTS = {
  production: {
    topic: "67331159-ae58-45a0-a006-836594b04a86", // "Nyhetsbrev / Newsletter"
    sv: "1d736a0a-d5d0-40b3-9df4-e658b09fbdb2", // "Nyhetsbrev – svenska"
    en: "e5419681-0bdc-4646-8b70-2b8fc5982461", // "Nyhetsbrev – English"
  },
  staging: {
    topic: "fea0c656-8655-4c90-9617-775bd224e3e8", // "Nyhetsbrev (staging)"
    sv: "46dee15f-c974-40b5-b432-064f3887b655", // "[Staging] Nyhetsbrev – svenska"
    en: "410ff4c6-408e-4e2f-bb77-183b6fac4320", // "[Staging] Nyhetsbrev – English"
  },
};
const IS_PRODUCTION = (Deno.env.get("SUPABASE_URL") ?? "").includes("heurpehcwbhohwklqnir");
const { topic: TOPIC_ID, ...SEGMENT } = IS_PRODUCTION ? LISTS.production : LISTS.staging;
// Resend allows 10 requests/second per team, shared with every other sender
// on the account -- stay well under it.
const PACE_MS = 150;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function resend(method: string, path: string, body?: unknown) {
  // Contacts/topics/segments need a full-access key; a sending-only key gets 401.
  const key = Deno.env.get("RESEND_NEWSLETTER_API_KEY") ?? Deno.env.get("RESEND_API_KEY");
  if (!key) throw new Error("RESEND_NEWSLETTER_API_KEY not configured");
  for (let attempt = 0; ; attempt++) {
    await sleep(PACE_MS);
    const res = await fetch(`${RESEND}${path}`, {
      method,
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    if (res.status === 429 && attempt < 3) {
      await sleep(1000 * (attempt + 1));
      continue;
    }
    const text = await res.text();
    let data: any = null;
    try { data = text ? JSON.parse(text) : null; } catch { data = text; }
    return { status: res.status, ok: res.ok, data };
  }
}

const enc = encodeURIComponent;

/** Create the contact or update its name/link; returns false on failure. */
async function ensureContact(email: string, first: string, last: string, userId: string, source = "app") {
  const fields: Record<string, unknown> = { first_name: first, last_name: last };
  if (IS_PRODUCTION) fields.properties = { pif_user_id: userId };
  const upd = await resend("PATCH", `/contacts/${enc(email)}`, fields);
  if (upd.ok) return true;
  if (upd.status !== 404) {
    console.error("[newsletter-sync] update contact failed", { status: upd.status, data: upd.data });
    return false;
  }
  // `source` only on create: an existing (external) contact keeps its origin.
  if (IS_PRODUCTION) fields.properties = { pif_user_id: userId, source };
  const created = await resend("POST", "/contacts", { email, ...fields });
  if (!created.ok) {
    console.error("[newsletter-sync] create contact failed", { status: created.status, data: created.data });
    return false;
  }
  return true;
}

async function setLanguageSegment(email: string, lang: "sv" | "en") {
  const other = lang === "sv" ? "en" : "sv";
  const add = await resend("POST", `/contacts/${enc(email)}/segments/${SEGMENT[lang]}`);
  if (!add.ok && add.status !== 409 && add.status !== 422) {
    console.error("[newsletter-sync] add to segment failed", { status: add.status, data: add.data });
  }
  const rm = await resend("DELETE", `/contacts/${enc(email)}/segments/${SEGMENT[other]}`);
  if (!rm.ok && rm.status !== 404) {
    console.error("[newsletter-sync] remove from segment failed", { status: rm.status, data: rm.data });
  }
}

async function setTopic(email: string, subscribed: boolean) {
  const res = await resend("PATCH", `/contacts/${enc(email)}/topics`, {
    topics: [{ id: TOPIC_ID, subscription: subscribed ? "opt_in" : "opt_out" }],
  });
  if (!res.ok) console.error("[newsletter-sync] topic update failed", { status: res.status, data: res.data });
}

/**
 * Leave the list: production deletes the contact, staging leaves its own
 * segments. Returns the contact's `source`, so an email change can carry it over.
 */
async function removeEmail(email: string): Promise<string | undefined> {
  if (!IS_PRODUCTION) {
    for (const seg of [SEGMENT.sv, SEGMENT.en]) {
      await resend("DELETE", `/contacts/${enc(email)}/segments/${seg}`);
    }
    return undefined;
  }
  const got = await resend("GET", `/contacts/${enc(email)}`);
  if (got.status === 404) return undefined;
  const source = got.data?.properties?.source ?? undefined;
  const del = await resend("DELETE", `/contacts/${enc(email)}`);
  if (!del.ok && del.status !== 404) {
    console.error("[newsletter-sync] delete contact failed", { status: del.status, data: del.data });
  }
  return source;
}

async function upsertUser(admin: any, userId: string, source?: string) {
  const { data: authData, error: authErr } = await admin.auth.admin.getUserById(userId);
  const user = authData?.user;
  if (authErr || !user?.email) return "no_user";
  // Never add an address nobody has confirmed.
  if (!user.email_confirmed_at) return "unconfirmed";

  const { data: profile } = await admin
    .from("profiles")
    .select("first_name, last_name, language, notification_preferences")
    .eq("id", userId)
    .maybeSingle();
  if (!profile) return "no_profile";

  const lang = profile.language === "en" ? "en" : "sv";
  // Opt-out semantics like every other email preference: absent = on.
  const subscribed = (profile.notification_preferences as any)?.email_newsletter !== false;

  const ok = await ensureContact(user.email, profile.first_name ?? "", profile.last_name ?? "", userId, source);
  if (!ok) return "failed";
  await setLanguageSegment(user.email, lang);
  await setTopic(user.email, subscribed);
  return "synced";
}

// --- Resend webhook (Svix signature) ---------------------------------------

function b64ToBytes(b64: string) {
  return Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
}

async function verifySvix(req: Request, payload: string) {
  const secret = Deno.env.get("RESEND_WEBHOOK_SECRET");
  const id = req.headers.get("svix-id");
  const ts = req.headers.get("svix-timestamp");
  const sigs = req.headers.get("svix-signature");
  if (!secret || !id || !ts || !sigs) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;

  const key = await crypto.subtle.importKey(
    "raw",
    b64ToBytes(secret.replace(/^whsec_/, "")),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const mac = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${payload}`));
  const expected = btoa(String.fromCharCode(...new Uint8Array(mac)));
  return sigs.split(" ").some((s) => s.split(",")[1] === expected);
}

async function handleWebhook(admin: any, event: any) {
  const email = event?.data?.email;
  if (!email) return "ignored";
  let subscribed: boolean | null = null;
  if (event.type === "contact.topics.updated") {
    // Events are account-wide: staging and production each act on their own topic only.
    const mine = (event.data.topics ?? []).find((t: any) => t.id === TOPIC_ID);
    if (mine) subscribed = mine.subscription === "opt_in";
  } else if (event.type === "contact.updated" && event.data.unsubscribed === true) {
    subscribed = false;
  }
  if (subscribed === null) return "ignored";

  const { data, error } = await admin.rpc("_newsletter_set_preference", {
    p_email: email,
    p_subscribed: subscribed,
  });
  if (error) {
    console.error("[newsletter-sync] set preference failed", { error: error.message });
    return "failed";
  }
  return data ? "updated" : "unchanged";
}

serve(async (req) => {
  const admin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );

  if (req.headers.get("svix-id")) {
    const payload = await req.text();
    if (!(await verifySvix(req, payload))) return json(401, { error: "Bad signature" });
    try {
      return json(200, { result: await handleWebhook(admin, JSON.parse(payload)) });
    } catch (e) {
      console.error("[newsletter-sync] webhook error", String(e));
      return json(500, { error: "webhook failed" });
    }
  }

  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!internalSecret || req.headers.get("x-internal-secret") !== internalSecret) {
    return json(401, { error: "Unauthorized" });
  }
  try {
    const body = await req.json().catch(() => ({}));
    switch (body.type) {
      case "upsert_user":
        return json(200, { result: await upsertUser(admin, String(body.userId)) });

      case "email_changed": {
        const source = body.oldEmail ? await removeEmail(String(body.oldEmail)) : undefined;
        return json(200, { result: await upsertUser(admin, String(body.userId), source) });
      }

      case "delete_email":
        await removeEmail(String(body.email));
        return json(200, { result: "removed" });

      case "import_external": {
        // Newsletter sign-ups from outside the app: { rows: [{ email, language,
        // first_name?, last_name? }] }. An address that's already a contact
        // (e.g. an app user) is left as it is -- the app's own data wins.
        const rows = Array.isArray(body.rows) ? body.rows.slice(0, 200) : [];
        const counts: Record<string, number> = {};
        const bump = (k: string) => (counts[k] = (counts[k] ?? 0) + 1);
        for (const row of rows) {
          const email = String(row?.email ?? "").trim().toLowerCase();
          if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { bump("invalid"); continue; }
          const lang = String(row?.language ?? "").toLowerCase().startsWith("en") ? "en" : "sv";
          const existing = await resend("GET", `/contacts/${enc(email)}`);
          if (existing.ok) { bump("exists"); continue; }
          const created = await resend("POST", "/contacts", {
            email,
            first_name: String(row?.first_name ?? ""),
            last_name: String(row?.last_name ?? ""),
            ...(IS_PRODUCTION ? { properties: { source: "external" } } : {}),
          });
          if (!created.ok) {
            console.error("[newsletter-sync] import create failed", { status: created.status, data: created.data });
            bump("failed");
            continue;
          }
          await setLanguageSegment(email, lang);
          bump(`imported_${lang}`);
        }
        return json(200, { counts });
      }

      case "backfill": {
        // Paged so one call stays well inside the function's time limit.
        const offset = Number(body.offset ?? 0);
        const limit = Math.min(Number(body.limit ?? 40), 60);
        const { data: rows, error } = await admin
          .from("profiles")
          .select("id")
          .order("created_at", { ascending: true })
          .range(offset, offset + limit - 1);
        if (error) return json(500, { error: error.message });
        const counts: Record<string, number> = {};
        for (const row of rows ?? []) {
          const r = await upsertUser(admin, row.id);
          counts[r] = (counts[r] ?? 0) + 1;
        }
        return json(200, { counts, next: (rows ?? []).length === limit ? offset + limit : null });
      }

      default:
        return json(400, { error: "unknown type" });
    }
  } catch (e) {
    console.error("[newsletter-sync] error", String(e));
    return json(500, { error: String(e) });
  }
});
