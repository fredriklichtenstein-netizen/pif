import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFICATIONS_FROM = "PIF <notifications@pif.today>";
// Overridable per-project so staging emails link back to the staging app
// instead of production (a staging test item/conversation 404s on prod).
const APP_URL = Deno.env.get("APP_URL") ?? "https://app.pif.community";
const LOGO_URL = "https://pif.today/pif-logo-long.png";
const BRAND_TURQUOISE = "#00CC99";

type NotificationType =
  | "new_message_digest"
  | "new_comment"
  | "feature_announcement"
  | "stale_item_reminder"
  | "item_force_archived";

// Which notification_preferences key gates each email type. Comment
// notifications reuse the existing "mentions" (someone replied to/near you)
// vs "item_updates" (someone commented on your own post) split that the
// in-app notification types (comment_reply/thread_comment vs
// post_commented) already encode.
// item_force_archived has no entry here on purpose -- it's mandatory,
// reporting something that already happened to the user's content, not an
// opt-out-able nudge.
const PREFERENCE_KEY: Record<string, string> = {
  new_message_digest: "email_messages",
  comment_reply: "email_mentions",
  thread_comment: "email_mentions",
  post_commented: "email_item_updates",
  feature_announcement: "email_announcements",
  stale_item_reminder: "email_item_updates",
};

// Copy per stale-item CTA kind, keyed by what _process_stale_items() (in
// Postgres) determined the item's current state to be.
const STALE_CTA_COPY: Record<string, { heading: (title: string, days: number) => string; body: (days: number) => string; ctaLabel: string }> = {
  no_interest: {
    heading: (title) => `Ingen har visat intresse för "${title}" än`,
    body: (days) => `Det har gått ${days} dagar sedan du la upp inlägget. Om timingen inte känns rätt just nu kan du arkivera det och återaktivera det senare för att testa intresset igen — eller uppdatera bilder eller beskrivning för att sticka ut mer.`,
    ctaLabel: "Visa inlägget",
  },
  select_receiver: {
    heading: (title) => `Grannar är intresserade av "${title}"`,
    body: (days) => `Det har gått ${days} dagar. Välj en mottagare bland de intresserade för att låsa upp meddelanden och komma vidare med överlämningen.`,
    ctaLabel: "Välj mottagare",
  },
  select_fulfiller: {
    heading: (title) => `Grannar vill uppfylla din önskan "${title}"`,
    body: (days) => `Det har gått ${days} dagar. Välj vem eller vilka som ska hjälpa dig, så kan ni stämma av detaljerna.`,
    ctaLabel: "Välj hjälpare",
  },
  confirm_handoff: {
    heading: (title) => `Har du lämnat över "${title}"?`,
    body: (days) => `Det har gått ${days} dagar sedan du valde en mottagare. Om ni inte redan bestämt tid för överlämning, ta kontakt för att komma överens. Redan klart? Bekräfta nedan så slutförs piffen.`,
    ctaLabel: "Bekräfta överlämning",
  },
  awaiting_receiver: {
    heading: (title) => `Väntar på bekräftelse för "${title}"`,
    body: () => `Du har bekräftat överlämningen — bra jobbat! Vi väntar nu på att mottagaren bekräftar mottagandet. Har det gått tyst en stund kan det vara bra att höra av dig direkt.`,
    ctaLabel: "Visa inlägget",
  },
  mark_granted: {
    heading: (title) => `Har din önskan "${title}" uppfyllts?`,
    body: (days) => `Det har gått ${days} dagar sedan du valde en hjälpare. Om ni inte redan stämt av detaljerna, ta kontakt för att komma vidare. Redan uppfylld? Markera den som klar nedan.`,
    ctaLabel: "Markera som uppfylld",
  },
  confirm_receipt: {
    heading: (title) => `Har du fått "${title}"?`,
    body: (days) => `Det har gått ${days} dagar sedan du blev vald. Om ni inte bestämt tid för hämtning än, hör av dig till piffaren. Redan mottaget? Bekräfta nedan.`,
    ctaLabel: "Bekräfta mottagande",
  },
  awaiting_owner: {
    heading: (title) => `Väntar på piffaren för "${title}"`,
    body: () => `Du har bekräftat mottagandet — vi väntar nu på att piffaren bekräftar överlämningen. Har det gått tyst en stund kan det vara bra att påminna dem.`,
    ctaLabel: "Visa inlägget",
  },
  check_in: {
    heading: (title) => `Du blev vald för "${title}"`,
    body: (days) => `Det har gått ${days} dagar sedan du blev vald att hjälpa till. Hör av dig till önskaren för att stämma av hur det går, om ni inte redan är i kontakt.`,
    ctaLabel: "Visa inlägget",
  },
};

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escape = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c]!,
  );

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function wrapEmail(bodyHtml: string, ctaUrl: string, ctaLabel: string): string {
  return `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; color: #1f2937;">
      <div style="text-align: center; margin-bottom: 24px;">
        <img src="${LOGO_URL}" alt="PIF - Pay it Forward" height="32" style="height: 32px; width: auto;" />
      </div>
      ${bodyHtml}
      <div style="text-align: center; margin: 28px 0;">
        <a href="${ctaUrl}" style="display: inline-block; background: ${BRAND_TURQUOISE}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600;">${escape(ctaLabel)}</a>
      </div>
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 32px;">
        Du får det här mejlet för att du är medlem i PIF. Hantera dina mejlaviseringar under
        <a href="${APP_URL}/account-settings" style="color: #9ca3af;">Kontoinställningar</a>.
      </p>
    </div>
  `;
}

function buildEmail(type: string, data: Record<string, unknown>): { subject: string; html: string } | null {
  if (type === "new_message_digest") {
    const otherName = String(data.otherUserName ?? "din granne");
    const conversationId = String(data.conversationId ?? "");
    return {
      subject: `Du har olästa meddelanden från ${otherName}`,
      html: wrapEmail(
        `<h2 style="font-size: 18px;">Olästa meddelanden</h2>
         <p>Du har olästa meddelanden i en konversation med <strong>${escape(otherName)}</strong> på PIF.</p>`,
        `${APP_URL}/messages?conversation=${encodeURIComponent(conversationId)}`,
        "Öppna konversationen",
      ),
    };
  }

  if (type === "new_comment") {
    const commentType = String(data.commentType ?? "post_commented");
    const commenterName = String(data.commenterName ?? "Någon");
    const itemTitle = String(data.itemTitle ?? "ditt inlägg");
    const itemId = String(data.itemId ?? "");
    const commentId = data.commentId != null ? String(data.commentId) : "";
    const commentContent = data.commentContent ? String(data.commentContent).slice(0, 300) : "";

    const headline =
      commentType === "comment_reply"
        ? `${commenterName} svarade på din kommentar`
        : commentType === "thread_comment"
          ? `${commenterName} kommenterade i en tråd du är med i`
          : `${commenterName} kommenterade "${itemTitle}"`;

    const itemUrl = `${APP_URL}/item/${encodeURIComponent(itemId)}`;
    return {
      subject: headline,
      html: wrapEmail(
        `<h2 style="font-size: 18px;">${escape(headline)}</h2>
         ${commentContent ? `<p style="background:#f9fafb; border-radius:8px; padding:12px 16px; font-style:italic;">"${escape(commentContent)}"</p>` : ""}`,
        commentId ? `${itemUrl}?comment=${encodeURIComponent(commentId)}` : itemUrl,
        "Visa inlägget",
      ),
    };
  }

  if (type === "stale_item_reminder") {
    const itemId = String(data.itemId ?? "");
    const itemTitle = String(data.itemTitle ?? "ditt inlägg");
    const daysOpen = Number(data.daysOpen ?? 7);
    const ctaKind = String(data.ctaKind ?? "no_interest");
    const copy = STALE_CTA_COPY[ctaKind] ?? STALE_CTA_COPY.no_interest;
    const itemUrl = `${APP_URL}/item/${encodeURIComponent(itemId)}`;
    const heading = copy.heading(itemTitle, daysOpen);
    return {
      subject: heading,
      html: wrapEmail(
        `<h2 style="font-size: 18px;">${escape(heading)}</h2><p>${escape(copy.body(daysOpen))}</p>`,
        itemUrl,
        copy.ctaLabel,
      ),
    };
  }

  if (type === "item_force_archived") {
    const itemId = String(data.itemId ?? "");
    const itemTitle = String(data.itemTitle ?? "ditt inlägg");
    const itemType = String(data.itemType ?? "offer");
    const noun = itemType === "offer" ? "Piffen" : "Önskan";
    const itemUrl = `${APP_URL}/item/${encodeURIComponent(itemId)}`;
    return {
      subject: `${noun} "${itemTitle}" har arkiverats automatiskt`,
      html: wrapEmail(
        `<h2 style="font-size: 18px;">${noun} "${escape(itemTitle)}" har arkiverats</h2>
         <p>Efter 30 dagars inaktivitet har vi arkiverat ${noun.toLowerCase()} automatiskt. Du kan återaktivera den när du vill.</p>`,
        itemUrl,
        "Återaktivera",
      ),
    };
  }

  if (type === "feature_announcement") {
    const title = String(data.title ?? "Nyheter i PIF");
    const bodyText = String(data.body ?? "");
    const actionUrl = data.actionUrl ? String(data.actionUrl) : "";
    const actionLabel = data.actionLabel ? String(data.actionLabel) : "Öppna PIF";
    return {
      subject: `Nytt i PIF: ${title}`,
      html: wrapEmail(
        `<h2 style="font-size: 18px;">${escape(title)}</h2>
         <p>${escape(bodyText).replace(/\n/g, "<br>")}</p>`,
        actionUrl ? `${APP_URL}${actionUrl}` : `${APP_URL}/`,
        actionLabel,
      ),
    };
  }

  return null;
}

async function sendOne(
  admin: ReturnType<typeof createClient>,
  resendKey: string,
  userId: string,
  type: string,
  data: Record<string, unknown>,
): Promise<{ userId: string; result: string }> {
  // The final reminder before the 30-day archive (and the archive notice
  // itself, which never has a pref key at all) are mandatory -- skip the
  // opt-out check regardless of the user's email_item_updates setting.
  const prefKey = data.isFinalReminder
    ? null
    : PREFERENCE_KEY[type] ?? PREFERENCE_KEY[String(data.commentType ?? "")];
  if (prefKey) {
    const { data: profile } = await admin
      .from("profiles")
      .select("notification_preferences")
      .eq("id", userId)
      .maybeSingle();
    const prefs = (profile as any)?.notification_preferences ?? {};
    if (prefs[prefKey] === false) {
      return { userId, result: "preference_disabled" };
    }
  }

  const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
  if (userErr || !userRes?.user?.email) {
    return { userId, result: "no_email" };
  }

  const email = buildEmail(type, data);
  if (!email) {
    return { userId, result: "unknown_type" };
  }

  const resendRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: NOTIFICATIONS_FROM,
      to: [userRes.user.email],
      subject: email.subject,
      html: email.html,
    }),
  });

  if (!resendRes.ok) {
    const text = await resendRes.text();
    console.error("Resend email failed", resendRes.status, text);
    return { userId, result: `resend_error_${resendRes.status}` };
  }

  return { userId, result: "sent" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Called from a DB trigger/cron job via pg_net, not by an end user --
    // authenticate via a shared secret (stored in Supabase Vault on the DB
    // side) instead of a user JWT.
    const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    const providedSecret = req.headers.get("x-internal-secret");
    if (!internalSecret || providedSecret !== internalSecret) {
      return json(401, { error: "Unauthorized" });
    }

    const body = await req.json().catch(() => ({}));
    const type = String(body.type ?? "").trim();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured — skipping email");
      return json(200, { ok: false, skipped: "no_resend_key" });
    }

    // Broadcast mode: a single edge function invocation loops every profile
    // and sends sequentially with a delay, instead of the DB firing one
    // net.http_post per recipient. Firing 149 concurrent async requests from
    // Postgres blew straight through Resend's 10 req/sec cap (133 of 149
    // sends failed with rate_limit_exceeded) -- pg_net's worker dispatches
    // its whole queue in one burst regardless of how the enqueue calls were
    // spaced out in SQL, so throttling has to happen inside one continuous
    // process instead.
    if (type === "feature_announcement_broadcast") {
      const announcementId = body.announcementId;
      const { data: announcement, error: announcementErr } = await admin
        .from("feature_announcements")
        .select("title_sv, body_sv, action_url, action_label_sv")
        .eq("id", announcementId)
        .maybeSingle();
      if (announcementErr || !announcement) {
        return json(404, { error: "Announcement not found" });
      }

      const { data: profiles, error: profilesErr } = await admin.from("profiles").select("id");
      if (profilesErr || !profiles) {
        return json(500, { error: "Failed to list profiles" });
      }

      const data = {
        title: announcement.title_sv,
        body: announcement.body_sv,
        actionUrl: announcement.action_url,
        actionLabel: announcement.action_label_sv,
      };

      const results: string[] = [];
      for (const profile of profiles) {
        const { result } = await sendOne(admin, resendKey, profile.id, "feature_announcement", data);
        results.push(result);
        await sleep(120);
      }

      const sent = results.filter((r) => r === "sent").length;
      return json(200, { ok: true, total: results.length, sent });
    }

    // Same single-invocation throttling pattern as the announcement
    // broadcast above, but for a mixed batch collected by
    // _process_stale_items() -- each entry carries its own `type`
    // ("stale_item_reminder" or "item_force_archived") and data.
    if (type === "stale_item_reminders_batch") {
      const items = Array.isArray(body.items) ? body.items : [];
      const results: string[] = [];
      for (const entry of items) {
        const entryUserId = String(entry?.userId ?? "");
        const entryType = String(entry?.type ?? "");
        if (!entryUserId || !entryType) {
          results.push("invalid_entry");
          continue;
        }
        const { result } = await sendOne(admin, resendKey, entryUserId, entryType, entry);
        results.push(result);
        await sleep(120);
      }
      const sent = results.filter((r) => r === "sent").length;
      return json(200, { ok: true, total: results.length, sent });
    }

    const userId = String(body.userId ?? "").trim();
    const data = (body.data ?? {}) as Record<string, unknown>;

    if (!userId || !type) {
      return json(400, { error: "Missing userId or type" });
    }

    const { result } = await sendOne(admin, resendKey, userId, type, data);
    if (result === "sent") return json(200, { ok: true });
    if (result === "preference_disabled") return json(200, { ok: true, skipped: result });
    if (result === "no_email" || result === "unknown_type") return json(200, { ok: false, skipped: result });
    return json(502, { error: "Resend send failed", detail: result });
  } catch (error) {
    console.error("send-notification-email error", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
