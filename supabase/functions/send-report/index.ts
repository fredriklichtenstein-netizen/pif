import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const REPORT_TO = "fredrik.lichtenstein@gmail.com";
const REPORT_FROM = "PIF Reports <reports@alwaysremember.se>";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await userClient.auth.getClaims(token);
    if (authError || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const itemId = String(body.itemId ?? "").trim();
    const reason = String(body.reason ?? "").trim();
    const reasonText = body.reasonText ? String(body.reasonText).slice(0, 2000) : null;
    const comments = body.comments ? String(body.comments).slice(0, 2000) : null;

    if (!itemId || !reason) {
      return new Response(JSON.stringify({ error: "Missing itemId or reason" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Fetch reporter profile (best-effort)
    let reporterName = "Okänd användare";
    try {
      const { data: profile } = await admin
        .from("profiles")
        .select("first_name, last_name, full_name, email")
        .eq("id", userId)
        .maybeSingle();
      if (profile) {
        reporterName =
          (profile as any).full_name ||
          [(profile as any).first_name, (profile as any).last_name].filter(Boolean).join(" ") ||
          (profile as any).email ||
          reporterName;
      }
    } catch (_) {
      // ignore — name is best-effort
    }

    // Insert into reports table. Try a few shapes for column compatibility.
    const baseRow = {
      reporter_id: userId,
      item_id: itemId,
      reason,
      details: reasonText,
      comments,
    };

    let insertError: unknown = null;
    let insertedId: string | null = null;
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

    insertError = await tryInsert(baseRow);
    if (insertError) {
      // Fallback: some schemas use `description` instead of `details`
      const alt = {
        reporter_id: userId,
        item_id: itemId,
        reason,
        description: [reasonText, comments].filter(Boolean).join("\n\n") || null,
      };
      insertError = await tryInsert(alt);
    }

    if (insertError) {
      console.error("reports insert failed", insertError);
      return new Response(
        JSON.stringify({ error: "Could not save report", details: String((insertError as any)?.message ?? insertError) }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Send email via Resend
    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (resendKey) {
      const escape = (s: string) =>
        s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
      const html = `
        <h2>Ny rapport på PIF</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          <tr><td><strong>Rapportör</strong></td><td>${escape(reporterName)}</td></tr>
          <tr><td><strong>Rapportör-ID</strong></td><td><code>${escape(userId)}</code></td></tr>
          <tr><td><strong>Inlägg-ID</strong></td><td><code>${escape(itemId)}</code></td></tr>
          <tr><td><strong>Anledning</strong></td><td>${escape(reason)}</td></tr>
          ${reasonText ? `<tr><td><strong>Beskrivning</strong></td><td>${escape(reasonText).replace(/\n/g, "<br>")}</td></tr>` : ""}
          ${comments ? `<tr><td><strong>Övriga kommentarer</strong></td><td>${escape(comments).replace(/\n/g, "<br>")}</td></tr>` : ""}
          ${insertedId ? `<tr><td><strong>Report-ID</strong></td><td><code>${escape(insertedId)}</code></td></tr>` : ""}
        </table>
      `;

      const emailRes = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: REPORT_FROM,
          to: [REPORT_TO],
          subject: `PIF-rapport: ${reason}`,
          html,
        }),
      });

      if (!emailRes.ok) {
        const text = await emailRes.text();
        console.error("Resend email failed", emailRes.status, text);
        // Don't fail the whole request — the report is saved.
      }
    } else {
      console.warn("RESEND_API_KEY not configured — skipping email notification");
    }

    return new Response(JSON.stringify({ ok: true, id: insertedId }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-report error", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
