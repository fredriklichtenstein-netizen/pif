// Builds one newsletter issue as two HTML emails (sv + en) for Resend
// broadcasts. The issue file (newsletter/issues/<name>.json) holds the
// subject, intro, the pif ids to feature, tips and outro; titles and photos
// are read from production's public items at build time.
//
//   bun scripts/newsletter.ts newsletter/issues/2026-11-draft.json
//
// Writes newsletter/out/<name>.{sv,en}.{html,txt}. The unsubscribe link is
// Resend's {{{RESEND_UNSUBSCRIBE_URL}}} merge tag, filled in per recipient
// when sent as a broadcast (topic "Nyhetsbrev / Newsletter").

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join } from "node:path";
import { resolveSupabaseConfig } from "../src/integrations/supabase/config";

type Lang = "sv" | "en";
type Text = Record<Lang, string>;
interface Issue {
  subject: Text;
  preview: Text;
  intro: Text;
  pifs: number[];
  tips: { title: Text; body: Text }[];
  outro: Text;
}

const APP_URL = "https://pif.today";
// Share-link Worker: 1200x630 WebP crop of the post's first photo.
const IMAGE_ORIGIN = "https://app.pif.community";
const LOGO_URL = "https://pif.today/pif-logo-long.png";
const TURQUOISE = "#00CC99";
const UNSUBSCRIBE = "{{{RESEND_UNSUBSCRIBE_URL}}}";

const COPY = {
  sv: {
    lang: "sv",
    tips: "Tips",
    cta: "Öppna PIF",
    footer: `Du får det här mejlet för att du har ett konto på PIF eller har anmält dig till vårt nyhetsbrev.`,
    unsubscribe: "Avsluta prenumerationen",
  },
  en: {
    lang: "en",
    tips: "Tips",
    cta: "Open PIF",
    footer: `You're receiving this email because you have a PIF account or signed up for our newsletter.`,
    unsubscribe: "Unsubscribe",
  },
};

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const paragraphs = (text: string, style: string) =>
  text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => `<p style="${style}">${escape(l)}</p>`)
    .join("");

async function fetchPifs(ids: number[]) {
  const { url, publishableKey } = resolveSupabaseConfig({});
  const res = await fetch(`${url}/rest/v1/items?select=id,title,pif_status&id=in.(${ids.join(",")})`, {
    headers: { apikey: publishableKey, Authorization: `Bearer ${publishableKey}` },
  });
  if (!res.ok) throw new Error(`items fetch failed: ${res.status} ${await res.text()}`);
  const rows: { id: number; title: string; pif_status: string }[] = await res.json();
  return ids.map((id) => {
    const row = rows.find((r) => r.id === id);
    if (!row) throw new Error(`pif ${id} not found`);
    if (row.pif_status !== "active") console.warn(`warning: pif ${id} is ${row.pif_status}, not active`);
    return row;
  });
}

// Photo only, linking to the post (title kept as alt text).
function pifCard(p: { id: number; title: string }) {
  const link = `${APP_URL}/feed?post=${p.id}`;
  return `
    <tr><td style="padding: 0 0 16px;">
      <a href="${link}" style="text-decoration: none; color: inherit; display: block;">
        <img src="${IMAGE_ORIGIN}/og/${p.id}.webp" width="480" alt="${escape(p.title.trim())}"
             style="display: block; width: 100%; max-width: 480px; height: auto; border-radius: 12px; border: 0;" />
      </a>
    </td></tr>`;
}

function render(issue: Issue, pifs: { id: number; title: string }[], lang: Lang) {
  const c = COPY[lang];
  const tips = issue.tips
    .map(
      (t) => `
        <p style="margin: 0 0 4px; font-weight: 600; color: #1f2937;">${escape(t.title[lang])}</p>
        <p style="margin: 0 0 14px; line-height: 1.5; color: #374151;">${escape(t.body[lang])}</p>`,
    )
    .join("");

  return `<!doctype html>
<html lang="${c.lang}">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escape(issue.subject[lang])}</title>
</head>
<body style="margin: 0; padding: 0; background: #f3f4f6;">
<div style="display: none; max-height: 0; overflow: hidden;">${escape(issue.preview[lang])}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: #f3f4f6;">
<tr><td align="center" style="padding: 24px 12px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
         style="max-width: 520px; background: #ffffff; border-radius: 16px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #1f2937;">
    <tr><td style="padding: 28px 20px 8px; text-align: center;">
      <a href="${APP_URL}"><img src="${LOGO_URL}" alt="PIF - Pay it Forward" height="32" style="height: 32px; width: auto; border: 0;" /></a>
    </td></tr>
    <tr><td style="padding: 16px 20px 4px;">
      ${paragraphs(issue.intro[lang], "margin: 0 0 12px; font-size: 16px; line-height: 1.55;")}
    </td></tr>
    <tr><td style="padding: 12px 20px 0;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${pifs.map((p) => pifCard(p)).join("")}</table>
    </td></tr>
    <tr><td style="padding: 0 20px;">
      <div style="background: #FFF7E6; border-left: 4px solid #FFCC66; border-radius: 8px; padding: 16px 16px 4px;">
        <p style="margin: 0 0 10px; font-size: 13px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; color: #92400e;">${c.tips}</p>
        ${tips}
      </div>
    </td></tr>
    <tr><td style="padding: 24px 20px 0;">
      ${paragraphs(issue.outro[lang], "margin: 0 0 12px; font-size: 16px; line-height: 1.55;")}
    </td></tr>
    <tr><td align="center" style="padding: 12px 20px 28px;">
      <a href="${APP_URL}/feed" style="display: inline-block; background: ${TURQUOISE}; color: #ffffff; text-decoration: none; padding: 13px 28px; border-radius: 8px; font-weight: 600; font-size: 16px;">${c.cta}</a>
    </td></tr>
  </table>
  <p style="max-width: 520px; margin: 16px auto 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; font-size: 12px; line-height: 1.5; color: #9ca3af; text-align: center;">
    ${c.footer}<br />
    <a href="${UNSUBSCRIBE}" style="color: #9ca3af;">${c.unsubscribe}</a>
  </p>
</td></tr>
</table>
</body>
</html>
`;
}

function renderText(issue: Issue, pifs: { id: number; title: string }[], lang: Lang) {
  const c = COPY[lang];
  return [
    issue.intro[lang],
    ...pifs.map((p) => `${p.title.trim()}\n${APP_URL}/feed?post=${p.id}`),
    `${c.tips.toUpperCase()}\n` + issue.tips.map((t) => `${t.title[lang]}: ${t.body[lang]}`).join("\n"),
    `${issue.outro[lang]}\n${APP_URL}/feed`,
    `--\n${c.footer}\n${c.unsubscribe}: ${UNSUBSCRIBE}`,
  ].join("\n\n");
}

const file = process.argv[2];
if (!file) {
  console.error("usage: bun scripts/newsletter.ts newsletter/issues/<name>.json");
  process.exit(1);
}
const issue: Issue = JSON.parse(readFileSync(file, "utf8"));
const pifs = await fetchPifs(issue.pifs);
const outDir = "newsletter/out";
mkdirSync(outDir, { recursive: true });
const name = basename(file, ".json");
for (const lang of ["sv", "en"] as Lang[]) {
  const path = join(outDir, `${name}.${lang}.html`);
  writeFileSync(path, render(issue, pifs, lang));
  writeFileSync(join(outDir, `${name}.${lang}.txt`), renderText(issue, pifs, lang));
  console.log(`${path}  subject: ${issue.subject[lang]}`);
}
