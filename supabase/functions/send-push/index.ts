import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Sends a push notification to every registered phone of one user (Trello
// G3.5). Called from Postgres by public._trigger_push() via pg_net, with the
// same x-internal-secret as send-notification-email. The database has
// already checked the user's push preference.
//
// iOS goes straight to APNs with a token-based (.p8) key:
//   APNS_KEY_P8  - the whole .p8 file (PEM, "-----BEGIN PRIVATE KEY-----" ...)
//   APNS_KEY_ID  - the key's 10-character id from Apple Developer -> Keys
//   APNS_TEAM_ID - optional, defaults to PIF App AB's team
//   APNS_TOPIC   - optional, defaults to the app's bundle id
// Without the key the function answers 200 { skipped } and sends nothing.
//
// Xcode builds get sandbox tokens; TestFlight / App Store builds get
// production ones. A token rejected by one APNs environment is retried on the
// other, and the stored environment is corrected. Dead tokens are deleted.
// Android (FCM) is not wired up yet: those rows are skipped.

const APNS_HOSTS = {
  production: "https://api.push.apple.com",
  sandbox: "https://api.sandbox.push.apple.com",
} as const;
type ApnsEnv = keyof typeof APNS_HOSTS;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });

const b64url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");

let cachedJwt: { token: string; issuedAt: number } | null = null;

async function apnsJwt(keyP8: string, keyId: string, teamId: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  // Apple wants the token refreshed at most every 60 min and at least every 20.
  if (cachedJwt && now - cachedJwt.issuedAt < 40 * 60) return cachedJwt.token;

  const pem = keyP8.replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");
  const der = Uint8Array.from(atob(pem), (c) => c.charCodeAt(0));
  const key = await crypto.subtle.importKey(
    "pkcs8",
    der,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
  const enc = new TextEncoder();
  const header = b64url(enc.encode(JSON.stringify({ alg: "ES256", kid: keyId })));
  const claims = b64url(enc.encode(JSON.stringify({ iss: teamId, iat: now })));
  const signingInput = `${header}.${claims}`;
  // WebCrypto returns the raw r||s signature JWS expects.
  const sig = new Uint8Array(
    await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, enc.encode(signingInput)),
  );
  const token = `${signingInput}.${b64url(sig)}`;
  cachedJwt = { token, issuedAt: now };
  return token;
}

async function sendApns(
  env: ApnsEnv,
  deviceToken: string,
  jwt: string,
  topic: string,
  payload: unknown,
): Promise<{ status: number; reason?: string }> {
  const res = await fetch(`${APNS_HOSTS[env]}/3/device/${deviceToken}`, {
    method: "POST",
    headers: {
      authorization: `bearer ${jwt}`,
      "apns-topic": topic,
      "apns-push-type": "alert",
      "apns-priority": "10",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.ok) {
    await res.body?.cancel();
    return { status: res.status };
  }
  const body = await res.json().catch(() => ({}));
  return { status: res.status, reason: body?.reason };
}

serve(async (req) => {
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!internalSecret || req.headers.get("x-internal-secret") !== internalSecret) {
    return json(401, { error: "Unauthorized" });
  }

  const keyP8 = Deno.env.get("APNS_KEY_P8");
  const keyId = Deno.env.get("APNS_KEY_ID");
  const teamId = Deno.env.get("APNS_TEAM_ID") || "JZS9N2HAC8";
  const topic = Deno.env.get("APNS_TOPIC") || "community.pif.pif";

  try {
    const body = await req.json().catch(() => ({}));
    const userId = typeof body.userId === "string" ? body.userId : "";
    const text = typeof body.body === "string" ? body.body.slice(0, 240) : "";
    const title = typeof body.title === "string" && body.title.trim() ? body.title.slice(0, 80) : "PIF";
    const url = typeof body.url === "string" && body.url.startsWith("/") ? body.url : "/";
    if (!userId || !text) return json(400, { error: "userId and body are required" });

    if (!keyP8 || !keyId) {
      console.log("send-push: APNs key not configured, skipping");
      return json(200, { skipped: "apns_not_configured" });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { persistSession: false, autoRefreshToken: false } },
    );

    const { data: devices, error } = await admin
      .from("push_devices")
      .select("id, token, platform, environment")
      .eq("user_id", userId);
    if (error) throw error;

    const jwt = await apnsJwt(keyP8, keyId, teamId);
    const payload = {
      aps: { alert: { title, body: text }, sound: "default" },
      url,
    };

    let sent = 0;
    let removed = 0;
    for (const d of devices ?? []) {
      if (d.platform !== "ios") continue;
      const first: ApnsEnv = d.environment === "sandbox" ? "sandbox" : "production";
      let env = first;
      let r = await sendApns(env, d.token, jwt, topic, payload);
      if (r.status === 400 && r.reason === "BadDeviceToken") {
        env = first === "production" ? "sandbox" : "production";
        r = await sendApns(env, d.token, jwt, topic, payload);
        if (r.status === 200) {
          await admin.from("push_devices").update({ environment: env }).eq("id", d.id);
        }
      }
      if (r.status === 200) {
        sent++;
      } else if (r.status === 410 || r.reason === "BadDeviceToken" || r.reason === "Unregistered") {
        await admin.from("push_devices").delete().eq("id", d.id);
        removed++;
      } else {
        console.error(`send-push: APNs ${env} ${r.status} ${r.reason ?? ""} for device ${d.id}`);
      }
    }

    return json(200, { sent, removed });
  } catch (e) {
    console.error("send-push failed:", e instanceof Error ? e.message : e);
    return json(500, { error: "send failed" });
  }
});
