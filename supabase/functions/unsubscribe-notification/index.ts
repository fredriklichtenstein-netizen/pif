import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// One-click email unsubscribe, per RFC 8058. Linked from
// send-notification-email via a List-Unsubscribe / List-Unsubscribe-Post
// header on every opt-out-able notification, plus a visible link in the
// email footer. No user session -- mail clients hit this directly (GET for
// a manual click, POST with List-Unsubscribe=One-Click for a mail client's
// own one-click button), so the request is authenticated by a signed token
// instead of a JWT.
//
// Built after a real spam complaint suppressed a user's address in Resend
// (2026-08-27): the email only had a small footer link to general account
// settings, no List-Unsubscribe header, so there was no one-click path a
// mail client could offer -- the user hit "report spam" instead. Gmail/
// Yahoo also require this header for bulk senders as of their 2024
// deliverability rules.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const APP_URL = Deno.env.get("APP_URL") ?? "https://pif.today";
const LOGO_URL = "https://pif.today/pif-logo-long.png";
const BRAND_TURQUOISE = "#00CC99";

// Must match PREFERENCE_KEY's value set in send-notification-email/index.ts.
const PREF_LABELS: Record<string, string> = {
  email_messages: "meddelanden",
  email_mentions: "omnämnanden",
  email_item_updates: "uppdateringar om dina inlägg",
  email_announcements: "nyheter i PIF",
};

async function verifySig(userId: string, prefKey: string, sig: string, secret: string): Promise<boolean> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(`${userId}:${prefKey}`));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  // Constant-time-ish compare -- length check first, then compare every
  // byte regardless of an early mismatch.
  if (expected.length !== sig.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ sig.charCodeAt(i);
  }
  return diff === 0;
}

function page(status: number, title: string, body: string): Response {
  const html = `
    <!doctype html>
    <html lang="sv">
    <head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title} — PIF</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 40px 16px;">
      <div style="max-width: 480px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 32px; text-align: center; color: #1f2937;">
        <img src="${LOGO_URL}" alt="PIF - Pay it Forward" height="32" style="height: 32px; width: auto; margin-bottom: 24px;" />
        <h1 style="font-size: 18px; margin: 0 0 12px;">${title}</h1>
        <p style="color: #4b5563; margin: 0 0 24px;">${body}</p>
        <a href="${APP_URL}/account-settings?tab=notifications" style="display: inline-block; background: ${BRAND_TURQUOISE}; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px;">Hantera mejlaviseringar</a>
      </div>
    </body>
    </html>
  `;
  return new Response(html, { status, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const userId = url.searchParams.get("u") ?? "";
    const prefKey = url.searchParams.get("k") ?? "";
    const sig = url.searchParams.get("sig") ?? "";

    const secret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
    if (!secret) {
      console.error("INTERNAL_FUNCTION_SECRET not configured");
      return page(500, "Något gick fel", "Försök igen senare, eller hantera dina mejlaviseringar direkt i appen.");
    }

    if (!userId || !prefKey || !sig || !PREF_LABELS[prefKey]) {
      return page(400, "Ogiltig länk", "Den här avregistreringslänken verkar trasig. Hantera dina mejlaviseringar direkt i appen istället.");
    }

    const validSig = await verifySig(userId, prefKey, sig, secret);
    if (!validSig) {
      return page(400, "Ogiltig länk", "Den här avregistreringslänken kunde inte verifieras. Hantera dina mejlaviseringar direkt i appen istället.");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(supabaseUrl, serviceKey);

    // Merge into the existing JSONB rather than overwrite it -- other
    // preference keys must survive untouched.
    const { error } = await admin.rpc("set_notification_preference" as any, {
      p_user_id: userId,
      p_key: prefKey,
      p_value: false,
    });

    if (error) {
      console.error("Failed to update notification_preferences", error);
      return page(500, "Något gick fel", "Vi kunde inte uppdatera dina inställningar just nu. Försök igen, eller hantera dem direkt i appen.");
    }

    const label = PREF_LABELS[prefKey];

    if (req.method === "POST") {
      // RFC 8058 one-click: the mail client performed this, not the user
      // directly -- a bare 200 is correct, no page is rendered.
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    return page(
      200,
      "Avregistrerad",
      `Du kommer inte längre få mejl om ${label} från PIF. Du kan när som helst slå på det igen under mejlaviseringar i appen.`,
    );
  } catch (error) {
    console.error("unsubscribe-notification error", error);
    return page(500, "Något gick fel", "Försök igen senare, eller hantera dina mejlaviseringar direkt i appen.");
  }
});
