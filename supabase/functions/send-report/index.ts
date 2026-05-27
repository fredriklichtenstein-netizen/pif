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

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

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

    // Fetch reporter profile (best-effort)
    let reporterName = "Okänd användare";
    let reporterEmail = "";
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("first_name, last_name, full_name, email")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        reporterName =
          (profile as any).full_name ||
          [(profile as any).first_name, (profile as any).last_name]
            .filter(Boolean)
            .join(" ") ||
          (profile as any).email ||
          reporterName;
        reporterEmail = (profile as any).email ?? "";
      }
    } catch (_) {
      // best-effort
    }

    // Try to persist the report. If the reports table is missing or has a
    // different shape we still email so moderators see the report.
    let insertedId: string | null = null;
    const itemIdNum = Number.isFinite(Number(itemIdRaw))
      ? Number(itemIdRaw)
      : null;

    const tryInsert = async (row: Record<string, unknown>) => {
      const { data, error } = await admin
        .from("reports")
        .insert(row)
        .select("id")
        .maybeSingle();
      if (error) return error;
      insertedId = (data as any)?.id ?? null;
      return null;
    };

    const shapes: Array<Record<string, unknown>> = [
      {
        reporter_id: userId,
        item_id: itemIdNum ?? itemIdRaw,
        reason,
        details: reasonText,
        comments,
      },
      {
        reporter_id: userId,
        item_id: itemIdNum ?? itemIdRaw,
        reason,
        description:
          [reasonText, comments].filter(Boolean).join("\n\n") || null,
      },
    ];

    let lastInsertError: unknown = null;
    for (const row of shapes) {
      const err = await tryInsert(row);
      if (!err) {
        lastInsertError = null;
        break;
      }
      lastInsertError = err;
    }
    if (lastInsertError) {
      console.warn(
        "reports insert failed — proceeding with email only",
        (lastInsertError as any)?.message ?? lastInsertError,
      );
    }

    // Send email via Resend (best-effort)
    const resendKey = Deno.env.get("RESEND_API_KEY");
    let emailOk = false;
    if (resendKey) {
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
      const html = `
        <h2>Ny rapport på PIF</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Rapportör</strong></td><td>${escape(reporterName)}${reporterEmail ? ` (${escape(reporterEmail)})` : ""}</td></tr>
          <tr><td><strong>Rapportör-ID</strong></td><td><code>${escape(userId)}</code></td></tr>
          <tr><td><strong>Inlägg-ID</strong></td><td><code>${escape(itemIdRaw)}</code></td></tr>
          ${commentIdRaw ? `<tr><td><strong>Kommentar-ID</strong></td><td><code>${escape(commentIdRaw)}</code></td></tr>` : ""}
          ${commentText ? `<tr><td><strong>Kommentarinnehåll</strong></td><td>${escape(commentText).replace(/\n/g, "<br>")}</td></tr>` : ""}
          <tr><td><strong>Anledning</strong></td><td>${escape(reason)}</td></tr>
          ${reasonText ? `<tr><td><strong>Beskrivning</strong></td><td>${escape(reasonText).replace(/\n/g, "<br>")}</td></tr>` : ""}
          ${comments ? `<tr><td><strong>Övriga kommentarer</strong></td><td>${escape(comments).replace(/\n/g, "<br>")}</td></tr>` : ""}
          ${insertedId ? `<tr><td><strong>Report-ID</strong></td><td><code>${escape(insertedId)}</code></td></tr>` : ""}
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
            subject: `PIF-rapport${commentIdRaw ? " (kommentar)" : ""}: ${reason}`,
            html,
          }),
        });
        emailOk = emailRes.ok;
        if (!emailRes.ok) {
          const text = await emailRes.text();
          console.error("Resend email failed", emailRes.status, text);
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
