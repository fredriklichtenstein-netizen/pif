import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-internal-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const NOTIFICATIONS_FROM = "PIF <notifications@pif.today>";
const APP_URL = "https://app.pif.community";
const LOGO_URL = "https://pif.today/pif-logo-long.png";
const BRAND_TURQUOISE = "#00CC99";

type NotificationType = "new_message_digest" | "new_comment" | "feature_announcement";

// Which notification_preferences key gates each email type. Comment
// notifications reuse the existing "mentions" (someone replied to/near you)
// vs "item_updates" (someone commented on your own post) split that the
// in-app notification types (comment_reply/thread_comment vs
// post_commented) already encode.
const PREFERENCE_KEY: Record<string, string> = {
  new_message_digest: "email_messages",
  comment_reply: "email_mentions",
  thread_comment: "email_mentions",
  post_commented: "email_item_updates",
  feature_announcement: "email_announcements",
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
        Du får det här mejlet för att du är medlem på PIF. Hantera dina mejlaviseringar under
        <a href="${APP_URL}/account-settings" style="color: #9ca3af;">Profilinställningar</a>.
      </p>
    </div>
  `;
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
    const userId = String(body.userId ?? "").trim();
    const type = String(body.type ?? "").trim() as NotificationType | string;
    const data = (body.data ?? {}) as Record<string, unknown>;

    if (!userId || !type) {
      return json(400, { error: "Missing userId or type" });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Defense-in-depth: the caller (SQL trigger/cron) already checks
    // notification_preferences before invoking this function, but re-check
    // here too since this endpoint sends real email.
    const prefKey = PREFERENCE_KEY[type] ?? PREFERENCE_KEY[String(data.commentType ?? "")];
    if (prefKey) {
      const { data: profile } = await admin
        .from("profiles")
        .select("notification_preferences")
        .eq("id", userId)
        .maybeSingle();
      const prefs = (profile as any)?.notification_preferences ?? {};
      if (prefs[prefKey] === false) {
        return json(200, { ok: true, skipped: "preference_disabled" });
      }
    }

    const { data: userRes, error: userErr } = await admin.auth.admin.getUserById(userId);
    if (userErr || !userRes?.user?.email) {
      return json(200, { ok: false, skipped: "no_email" });
    }
    const toEmail = userRes.user.email;

    let subject = "";
    let html = "";

    if (type === "new_message_digest") {
      const otherName = String(data.otherUserName ?? "din granne");
      const conversationId = String(data.conversationId ?? "");
      subject = `Du har olästa meddelanden från ${otherName}`;
      html = wrapEmail(
        `<h2 style="font-size: 18px;">Olästa meddelanden</h2>
         <p>Du har olästa meddelanden i en konversation med <strong>${escape(otherName)}</strong> på PIF.</p>`,
        `${APP_URL}/messages?conversation=${encodeURIComponent(conversationId)}`,
        "Öppna konversationen",
      );
    } else if (type === "new_comment") {
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
      subject = headline;
      html = wrapEmail(
        `<h2 style="font-size: 18px;">${escape(headline)}</h2>
         ${commentContent ? `<p style="background:#f9fafb; border-radius:8px; padding:12px 16px; font-style:italic;">"${escape(commentContent)}"</p>` : ""}`,
        commentId ? `${itemUrl}?comment=${encodeURIComponent(commentId)}` : itemUrl,
        "Visa inlägget",
      );
    } else if (type === "feature_announcement") {
      const title = String(data.title ?? "Nyheter i PIF");
      const bodyText = String(data.body ?? "");
      subject = `Nytt i PIF: ${title}`;
      html = wrapEmail(
        `<h2 style="font-size: 18px;">${escape(title)}</h2>
         <p>${escape(bodyText).replace(/\n/g, "<br>")}</p>`,
        `${APP_URL}/`,
        "Öppna PIF",
      );
    } else {
      return json(400, { error: `Unknown notification type: ${type}` });
    }

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) {
      console.warn("RESEND_API_KEY not configured — skipping email");
      return json(200, { ok: false, skipped: "no_resend_key" });
    }

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: NOTIFICATIONS_FROM,
        to: [toEmail],
        subject,
        html,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("Resend email failed", emailRes.status, text);
      return json(502, { error: "Resend send failed", detail: text });
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error("send-notification-email error", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
