import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Weekly key figures email (Trello #135). pg_cron (send-weekly-report, Mondays) calls
// public._send_weekly_report(), which posts here with the shared x-internal-secret.
// Counts only (public._weekly_report_stats): no personal data in the email.
//
// Recipients: secret WEEKLY_REPORT_TO (comma-separated), so addresses stay out of the repo.
// Test send: body {"to": "someone@pif.community"} sends only to that address.
// Period: the previous Monday 00:00 to this Monday 00:00, Swedish time, compared with the
// week before.

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const TZ = "Europe/Stockholm";

/** UTC instant of 00:00 Stockholm time on the given Stockholm calendar date. */
function stockholmMidnight(y: number, m: number, d: number): Date {
  // Start from 00:00 UTC that day and correct by Stockholm's offset at that moment.
  const guess = new Date(Date.UTC(y, m - 1, d, 0, 0, 0));
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hourCycle: "h23" })
    .formatToParts(guess);
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0"); // 1 (winter) or 2 (summer)
  return new Date(guess.getTime() - hour * 3600_000);
}

function stockholmDateParts(t: Date) {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit", weekday: "short" })
    .formatToParts(t);
  const get = (k: string) => p.find((x) => x.type === k)?.value ?? "";
  const wd = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(get("weekday"));
  return { y: Number(get("year")), m: Number(get("month")), d: Number(get("day")), wd };
}

/** This week's Monday 00:00 (Stockholm) as UTC. */
function thisMonday(now: Date): Date {
  const { y, m, d, wd } = stockholmDateParts(now);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() - wd);
  return stockholmMidnight(base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate());
}

function isoWeek(t: Date): number {
  const { y, m, d } = stockholmDateParts(t);
  const date = new Date(Date.UTC(y, m - 1, d));
  const day = (date.getUTCDay() + 6) % 7;
  date.setUTCDate(date.getUTCDate() - day + 3);
  const firstThursday = new Date(Date.UTC(date.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((date.getTime() - firstThursday.getTime()) / 86400000 - 3 + ((firstThursday.getUTCDay() + 6) % 7)) / 7);
}

const fmtDay = (t: Date) => new Intl.DateTimeFormat("sv-SE", { timeZone: TZ, day: "numeric", month: "short" }).format(t);

type Stats = Record<string, number | Record<string, number>>;

const ROWS: Array<{ section: string; rows: Array<[string, string]> }> = [
  { section: "Användare", rows: [
    ["users_total", "Konton totalt"],
    ["users_new", "Nya konton"],
    ["users_signed_in", "Loggade in"],
    ["users_active", "Aktiva (lade upp, visade intresse, kommenterade, sparade eller skrev)"],
    ["push_devices_total", "Har appen med push (totalt)"],
  ] },
  { section: "Inlägg", rows: [
    ["pifs_new", "Nya piffar"],
    ["wishes_new", "Nya önskningar"],
    ["pifs_active", "Aktiva piffar (totalt)"],
    ["wishes_active", "Aktiva önskningar (totalt)"],
    ["pifs_completed", "Genomförda piffar"],
    ["wishes_completed", "Uppfyllda önskningar"],
    ["completed_outside", "Klara utanför appen"],
    ["archived", "Arkiverade"],
  ] },
  { section: "Aktivitet", rows: [
    ["interests_new", "Visat intresse"],
    ["chosen", "Valda mottagare / hjälpare"],
    ["conversations_new", "Nya konversationer"],
    ["messages_sent", "Skickade meddelanden"],
    ["comments_new", "Kommentarer"],
    ["saves_new", "Sparade inlägg"],
    ["follows_new", "Nya följare"],
  ] },
  { section: "Trygghet", rows: [
    ["reports_new", "Rapporter"],
    ["blocks_new", "Blockeringar"],
  ] },
];

const CAMPAIGN_LABELS: Record<string, string> = {
  signup: "Nya konton via nyhetsbrev",
  first_post: "Första inlägg via nyhetsbrev",
  first_interest: "Första intresse via nyhetsbrev",
  first_save: "Första sparade via nyhetsbrev",
};

function change(cur: number, prev: number): string {
  if (cur === prev) return "–";
  const diff = cur - prev;
  return `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}`;
}

function render(cur: Stats, prev: Stats, weekNo: number, from: Date, to: Date) {
  const last = new Date(to.getTime() - 1);
  const title = `PIF – nyckeltal vecka ${weekNo} (${fmtDay(from)}–${fmtDay(last)})`;
  const num = (s: Stats, k: string) => (typeof s[k] === "number" ? (s[k] as number) : 0);
  const camp = (s: Stats) => (s.campaign_events && typeof s.campaign_events === "object" ? (s.campaign_events as Record<string, number>) : {});

  const sections = [...ROWS];
  const campKeys = Array.from(new Set([...Object.keys(camp(cur)), ...Object.keys(camp(prev))]));
  const campRows = campKeys.map((k) => [k, CAMPAIGN_LABELS[k] ?? k] as [string, string]);

  let html = `<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#1f2937;max-width:640px">`
    + `<h2 style="margin:0 0 4px">${title}</h2>`
    + `<p style="margin:0 0 16px;color:#6b7280;font-size:14px">Jämfört med veckan innan. Bara antal – inga personuppgifter.</p>`
    + `<table style="border-collapse:collapse;width:100%;font-size:14px">`;
  let text = `${title}\nJämfört med veckan innan. Bara antal – inga personuppgifter.\n`;
  const row = (label: string, c: number, p: number) => {
    html += `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${label}</td>`
      + `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${c}</td>`
      + `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:#6b7280">${p}</td>`
      + `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:${c > p ? "#059669" : c < p ? "#dc2626" : "#6b7280"}">${change(c, p)}</td></tr>`;
    text += `  ${label}: ${c} (förra veckan ${p})\n`;
  };
  const head = (name: string) => {
    html += `<tr><th colspan="4" style="text-align:left;padding:14px 8px 6px;font-size:13px;text-transform:uppercase;color:#00a37a">${name}</th></tr>`
      + `<tr style="color:#6b7280;font-size:12px"><td></td><td style="text-align:right;padding:0 8px">Vecka ${weekNo}</td><td style="text-align:right;padding:0 8px">Veckan innan</td><td></td></tr>`;
    text += `\n${name}\n`;
  };
  for (const s of sections) {
    head(s.section);
    for (const [k, label] of s.rows) row(label, num(cur, k), num(prev, k));
  }
  head("Nyhetsbrev");
  row("Kom in i appen från nyhetsbrevet", num(cur, "newsletter_clicks"), num(prev, "newsletter_clicks"));
  for (const [k, label] of campRows) row(label, camp(cur)[k] ?? 0, camp(prev)[k] ?? 0);

  // Feature updates: the popup in the app and the email (?ref=fa- links).
  const fev = (s: Stats) => (s.feature_events && typeof s.feature_events === "object" ? (s.feature_events as Record<string, number>) : {});
  const fevKeys = Array.from(new Set([...Object.keys(fev(cur)), ...Object.keys(fev(prev))]));
  const latest = typeof (cur as any).announcement_latest === "string" ? String((cur as any).announcement_latest) : "";
  head("Funktionsnyheter");
  if (latest) {
    const d = new Intl.DateTimeFormat("sv-SE", { day: "numeric", month: "short" }).format(new Date(`${latest}T12:00:00Z`));
    // A snapshot (only the latest "seen" time is stored), so no comparison.
    const seen = num(cur, "announcement_seen_total");
    html += `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">Har sett senaste nyheten i appen (${d}), totalt</td>`
      + `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;font-weight:600">${seen}</td>`
      + `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right;color:#6b7280">–</td><td style="border-bottom:1px solid #eee"></td></tr>`;
    text += `  Har sett senaste nyheten i appen (${d}), totalt: ${seen}\n`;
    row("… varav nya den här veckan", num(cur, "announcement_seen_new"), num(prev, "announcement_seen_new"));
  }
  row("Kom in i appen från nyhetsmejlet", num(cur, "feature_clicks"), num(prev, "feature_clicks"));
  for (const k of fevKeys) {
    const label = (CAMPAIGN_LABELS[k] ?? k).replace("via nyhetsbrev", "via nyhetsmejlet");
    row(label, fev(cur)[k] ?? 0, fev(prev)[k] ?? 0);
  }
  html += `</table><p style="margin-top:16px;color:#9ca3af;font-size:12px">Skickas varje måndag från PIF. Svara på mejlet för frågor.</p></div>`;
  return { title, html, text };
}

serve(async (req) => {
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  if (!internalSecret || req.headers.get("x-internal-secret") !== internalSecret) {
    return json(401, { error: "Unauthorized" });
  }
  try {
    const body = await req.json().catch(() => ({}));
    const testTo = typeof body?.to === "string" && /^[^\s@]+@[^\s@]+$/.test(body.to) ? body.to : null;
    const recipients = testTo
      ? [testTo]
      : (Deno.env.get("WEEKLY_REPORT_TO") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    if (recipients.length === 0) return json(200, { skipped: "no recipients (WEEKLY_REPORT_TO)" });

    const now = new Date();
    const to = thisMonday(now);
    const from = new Date(to.getTime() - 7 * 86400_000);
    const prevFrom = new Date(from.getTime() - 7 * 86400_000);
    // Re-anchor on Stockholm midnights so a DST change inside a week doesn't shift the edges.
    const fp = stockholmDateParts(new Date(from.getTime() + 12 * 3600_000));
    const pp = stockholmDateParts(new Date(prevFrom.getTime() + 12 * 3600_000));
    const fromA = stockholmMidnight(fp.y, fp.m, fp.d);
    const prevA = stockholmMidnight(pp.y, pp.m, pp.d);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const [{ data: cur, error: e1 }, { data: prev, error: e2 }] = await Promise.all([
      admin.rpc("_weekly_report_stats", { p_from: fromA.toISOString(), p_to: to.toISOString() }),
      admin.rpc("_weekly_report_stats", { p_from: prevA.toISOString(), p_to: fromA.toISOString() }),
    ]);
    if (e1 || e2) throw e1 ?? e2;

    const staging = !Deno.env.get("SUPABASE_URL")?.includes("heurpehcwbhohwklqnir");
    const { title, html, text } = render(cur as Stats, prev as Stats, isoWeek(fromA), fromA, to);
    const subject = (staging ? "[Staging] " : "") + title;

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json(500, { error: "RESEND_API_KEY not configured" });
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "PIF <reports@pif.today>",
        reply_to: "hej@pif.community",
        to: recipients,
        subject,
        html,
        text,
      }),
    });
    const out = await res.json().catch(() => ({}));
    if (!res.ok) {
      console.error("Resend email failed", res.status, out);
      return json(502, { error: "send failed", status: res.status });
    }
    return json(200, { sent: recipients.length, id: (out as any)?.id ?? null, period: [fromA.toISOString(), to.toISOString()] });
  } catch (err) {
    console.error("weekly-report failed", err);
    return json(500, { error: String((err as any)?.message ?? err) });
  }
});
