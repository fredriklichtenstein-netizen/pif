import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// IMPORTANT: these two domains are NOT interchangeable.
//   pif.today     — verified in Resend for SENDING, but has NO MX record, so
//                   it cannot receive mail. Anything addressed here bounces.
//   pif.community — has MX (Google Workspace), i.e. the real inbox.
// Routing feedback to hej@pif.today silently black-holed every submission
// (bounced / delivery_delayed in Resend) from 2026-07-28 until this fix.
// The From must stay on pif.today because that's the verified sending domain;
// replies are handled by reply_to, which is set to the submitting user.
const FEEDBACK_TO = "hej@pif.community";
const FEEDBACK_FROM = "PIF <hej@pif.today>";

// --- Trello mirroring -------------------------------------------------------
// Feedback is also filed as a card on the PIF backlog board so it lands in the
// triage flow instead of only an inbox.
//
// DELIBERATELY MINIMAL: the card carries ONLY the category, the free text and
// the submission time. No screenshot, no user id, no name, no email. The full
// record — including the screenshot and who sent it — stays in the email, which
// is a single mailbox already under the controller's control. Keeping Trello
// free of identifiers means mirroring feedback does not widen the personal-data
// footprint to another processor. Do not "helpfully" add the sender back.
//
// These ids are not secrets (they identify a private board, they don't grant
// access to it), so they live here rather than in env. Regenerate from
// https://trello.com/b/Fs4TDO6L/pif-backlog-mvp-2026 if the board is recreated.
const TRELLO_INBOX_LIST_ID = "6a789ba356a85081c2421fec"; // "Inbox"
const TRELLO_BUG_LABEL_ID = "6a789ba356a85081c24220d1"; // red "Bug"

/**
 * Mirror a submission to Trello. Best-effort by design: feedback reaching the
 * mailbox is what matters, so any failure here is logged and swallowed. A Trello
 * outage, an expired token or a deleted list must never turn a submission into
 * an error for the user — silent loss of feedback is the exact failure this
 * function already suffered once (2026-07-28 → 08-04).
 */
async function mirrorToTrello(
  feedbackType: "issue" | "feedback",
  feedbackText: string,
  submittedAt: Date,
): Promise<void> {
  const key = Deno.env.get("TRELLO_KEY");
  const token = Deno.env.get("TRELLO_TOKEN");
  if (!key || !token) return; // not configured (e.g. staging) — skip quietly

  const typeLabel = feedbackType === "issue" ? "Problem" : "Feedback";

  // Local time for a human reading the board; ISO kept in the body so the exact
  // instant is unambiguous regardless of who reads it from where.
  const local = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Stockholm",
    dateStyle: "short",
    timeStyle: "short",
  }).format(submittedAt);

  const firstLine = feedbackText.replace(/\s+/g, " ").trim();
  const title = `[${typeLabel}] ${
    firstLine.length > 80 ? `${firstLine.slice(0, 80)}…` : firstLine
  }`;

  const desc = [
    `**Kategori:** ${typeLabel}`,
    `**Inskickat:** ${local} (${submittedAt.toISOString()})`,
    "",
    "---",
    "",
    feedbackText,
    "",
    "---",
    "_Inskickat via appens feedbackformulär. Avsändare och ev. skärmbild finns",
    "endast i mejlet till hej@pif.community — medvetet inte här._",
  ].join("\n");

  const params = new URLSearchParams({
    key,
    token,
    idList: TRELLO_INBOX_LIST_ID,
    name: title,
    desc,
    pos: "top",
  });
  if (feedbackType === "issue") params.set("idLabels", TRELLO_BUG_LABEL_ID);

  try {
    const res = await fetch(`https://api.trello.com/1/cards?${params}`, {
      method: "POST",
    });
    if (!res.ok) {
      console.error("Trello card creation failed", res.status, await res.text());
    }
  } catch (err) {
    console.error("Trello card creation threw", err);
  }
}

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

    // Screenshot as a proper email ATTACHMENT, not an inline data: URI in
    // the HTML body. Reported live: screenshots "rarely render at all" on
    // desktop and load slowly on mobile -- desktop Outlook's Word-based
    // rendering engine is well known for not supporting data: URI images
    // in <img src> at all (explains "rarely renders on desktop"), and a
    // multi-MB inline base64 blob (html2canvas captures the whole page)
    // bloats the entire email's payload (explains "loads slowly on
    // mobile"). A real attachment is universally supported and keeps the
    // HTML body itself small.
    const screenshotNote = screenshotBase64
      ? `<p>📎 En skärmbild är bifogad mejlet.</p>`
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
      ${screenshotNote}
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
        ...(screenshotBase64
          ? { attachments: [{ filename: "skarmbild.png", content: screenshotBase64 }] }
          : {}),
      }),
    });

    if (!emailRes.ok) {
      const text = await emailRes.text();
      console.error("Resend feedback email failed", emailRes.status, text);
      return json(500, { error: "Failed to send email" });
    }

    // Mirror to the backlog board only after the email is safely away, and
    // awaited so the Deno process isn't torn down mid-request. Failures inside
    // are swallowed — the submission has already succeeded by this point.
    await mirrorToTrello(feedbackType, feedbackText, new Date());

    return json(200, { ok: true });
  } catch (error) {
    console.error("send-feedback error", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
