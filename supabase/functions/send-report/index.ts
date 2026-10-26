import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const REPORT_TO = "fredrik.lichtenstein@gmail.com";
const REPORT_FROM = "PIF Reports <reports@alwaysremember.se>";
const APP_URL = "https://app.pif.community";

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escape = (s: unknown) =>
  String(s ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[c] ?? c,
  );

// escape() plus <br> for user-written multi-line text
const escapeMultiline = (s: unknown) => escape(s).replace(/\n/g, "<br>");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
        // fall through — userId stays null
      }
    }
    if (!userId) {
      return json(401, { error: "Unauthorized" });
    }

    const body = await req.json().catch(() => ({}));
    const itemIdRaw = String(body.itemId ?? "").trim();
    const commentIdRaw = body.commentId ? String(body.commentId).trim() : "";
    const commentText = body.commentText
      ? String(body.commentText).slice(0, 4000)
      : null;
    const reason = String(body.reason ?? "").trim();
    const reasonText = body.reasonText
      ? String(body.reasonText).slice(0, 2000)
      : null;
    const comments = body.comments
      ? String(body.comments).slice(0, 2000)
      : null;

    if (!itemIdRaw || !reason) {
      return json(400, { error: "Missing itemId or reason" });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Reporter details (best-effort). `profiles` has no full_name/email
    // columns — selecting them makes the whole query error — so the name
    // comes from first_name/last_name and the email from auth.users.
    let reporterName = "Okänd användare";
    let reporterEmail = "";
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("first_name, last_name")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        reporterName =
          [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
          reporterName;
      }
    } catch (_) {
      // best-effort
    }
    try {
      const { data: authUser } = await admin.auth.admin.getUserById(userId);
      reporterEmail = authUser?.user?.email ?? "";
    } catch (_) {
      // best-effort
    }

    // Persist the report. If this fails we still email so the report isn't lost.
    let insertedId: string | null = null;
    const itemIdNum = Number.isFinite(Number(itemIdRaw))
      ? Number(itemIdRaw)
      : null;
    try {
      const { data, error } = await admin
        .from("reports")
        .insert({
          reporter_id: userId,
          item_id: itemIdNum ?? itemIdRaw,
          reason,
          details: reasonText,
          comments,
        })
        .select("id")
        .maybeSingle();
      if (error) {
        console.warn(
          "reports insert failed — proceeding with email only",
          error.message,
        );
      } else {
        insertedId = data?.id ?? null;
      }
    } catch (e) {
      console.warn("reports insert threw — proceeding with email only", e);
    }

    // Send email via Resend (best-effort)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailOk = false;
    if (resendKey) {
      const isComment = !!commentIdRaw;
      const postUrl = `${APP_URL}/item/${encodeURIComponent(itemIdRaw)}`;
      const row = (label: string, value: string) =>
        `<tr><td><strong>${label}</strong></td><td>${value}</td></tr>`;
      const html = `
        <h2>Ny rapport på PIF</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          ${row("Rapportör", escape(reporterName))}
          ${row("Rapportör-email", escape(reporterEmail))}
          ${row("Rapportör-ID", `<code>${escape(userId)}</code>`)}
          ${row("Inlägg-ID", `<code>${escape(itemIdRaw)}</code>`)}
          ${row("Inlägg-URL", `<a href="${escape(postUrl)}">${escape(postUrl)}</a>`)}
          ${isComment ? row("Kommentar-ID", `<code>${escape(commentIdRaw)}</code>`) : ""}
          ${commentText ? row("Kommentar", escapeMultiline(commentText)) : ""}
          ${row("Anledning", escape(reason))}
          ${reasonText ? row("Beskrivning", escapeMultiline(reasonText)) : ""}
          ${comments ? row("Övriga kommentarer", escapeMultiline(comments)) : ""}
          ${insertedId ? row("Report-ID", `<code>${escape(insertedId)}</code>`) : ""}
        </table>
      `;
      try {
        const emailRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: REPORT_FROM,
            to: [REPORT_TO],
            subject: `PIF-rapport${isComment ? " (kommentar)" : ""}: ${reason}`,
            html,
          }),
        });
        emailOk = emailRes.ok;
        if (!emailRes.ok) {
          console.error(
            "Resend email failed",
            emailRes.status,
            await emailRes.text(),
          );
        }
      } catch (e) {
        console.error("Resend request threw", e);
      }
    } else {
      console.warn("RESEND_API_KEY not configured — skipping email");
    }

    // Treat the request as successful as long as either DB or email succeeded.
    if (!insertedId && !emailOk) {
      return json(500, { error: "Failed to record report" });
    }

    return json(200, { ok: true, id: insertedId, emailed: emailOk });
  } catch (error) {
    console.error("send-report error", error);
    return json(500, {
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});
