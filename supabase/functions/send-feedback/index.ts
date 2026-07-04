import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const FEEDBACK_TO = "fredrik.lichtenstein@gmail.com";
const FEEDBACK_FROM = "PIF Feedback <reports@alwaysremember.se>";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (s: string) =>
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

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    let userId: string | null = null;
    if (authHeader.startsWith("Bearer ")) {
      try {
        const userClient = createClient(supabaseUrl, anonKey, {
          global: { headers: { Authorization: authHeader } },
        });
        const { data } = await userClient.auth.getUser();
        userId = data.user?.id ?? null;
      } catch (_) {
        /* userId stays null */
      }
    }
    if (!userId) return json(401, { error: "Unauthorized" });

    const body = await req.json().catch(() => ({}));
    const feedbackText = String(body.feedback_text ?? "").trim().slice(0, 8000);
    const feedbackType =
      body.feedback_type === "feedback" ? "feedback" : "issue";
    const senderName = body.sender_name
      ? String(body.sender_name).slice(0, 200)
      : "";
    const senderEmail = body.sender_email
      ? String(body.sender_email).slice(0, 320)
      : "";
    const screenshotBase64 = body.screenshot_base64
      ? String(body.screenshot_base64)
      : "";

    if (!feedbackText) return json(400, { error: "Missing feedback_text" });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json(500, { error: "Email not configured" });

    const typeLabelSv =
      feedbackType === "issue" ? "Rapportera ett problem" : "Ge feedback";
    const displayName = senderName || "Anonym";
    const subject = `PIF — ${typeLabelSv} från ${displayName}`;

    // Screenshot as inline data URI in HTML body (approved approach).
    const screenshotHtml = screenshotBase64
      ? `<h3>Skärmbild</h3><img src="data:image/png;base64,${screenshotBase64}" alt="Screenshot" style="max-width:100%;border:1px solid #ddd;border-radius:8px" />`
      : "";

    const html = `
      <h2>Ny ${escapeHtml(typeLabelSv.toLowerCase())} på PIF</h2>
      <table cellpadding="6" style="border-collapse:collapse">
        <tr><td><strong>Typ</strong></td><td>${escapeHtml(typeLabelSv)}</td></tr>
        <tr><td><strong>Från</strong></td><td>${escapeHtml(displayName)}${senderEmail ? ` (${escapeHtml(senderEmail)})` : ""}</td></tr>
        <tr><td><strong>Användar-ID</strong></td><td><code>${escapeHtml(userId)}</code></td></tr>
      </table>
      <h3>Meddelande</h3>
      <div style="white-space:pre-wrap;padding:12px;background:#f6f6f6;border-radius:8px">${escapeHtml(feedbackText)}</div>
      ${screenshotHtml}
    `;

    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FEEDBACK_FROM,
        to: [FEEDBACK_TO],
        subject,
        html,
        reply_to: senderEmail || undefined,
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("Resend feedback email failed", emailRes.status, text);
      return json(500, { error: "Failed to send email" });
    }

    return json(200, { ok: true });
  } catch (error) {
    console.error("send-feedback error", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
