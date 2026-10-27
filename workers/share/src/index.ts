// Share-link Worker for app.pif.community (replaces the third-party Hado
// prerender proxy). Shared item links look like <SHARE_ORIGIN>/item/<id>.
//
// - Link-preview crawlers on /item/<id> get a tiny HTML page with that item's
//   Open Graph / Twitter tags, built here from Supabase's REST API with the
//   public anon key. (Not via the og-preview edge function: *.supabase.co
//   serves function HTML as text/plain with a sandbox CSP, which crawlers
//   ignore.)
// - Other crawler requests (/, /feed, the og:image fallback, ...) are proxied
//   from the app so crawlers get a 200, not a redirect.
// - Browsers get a 302 to the same path on APP_ORIGIN — pif.today is the only
//   origin that serves the app, and the installed PWA is scoped to it.

export interface Env {
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
  APP_ORIGIN: string; // e.g. https://pif.today
  SHARE_ORIGIN: string; // e.g. https://app.pif.community
}

// Substring match, case-insensitive. iMessage previews identify as
// facebookexternalhit/Twitterbot. Search engines are deliberately absent:
// they render JS and should follow the redirect like a browser.
const CRAWLERS = [
  "facebookexternalhit",
  "meta-externalagent", // Meta's newer preview fetchers (Facebook posts)
  "meta-externalfetcher",
  "facebot",
  "twitterbot",
  "whatsapp",
  "linkedinbot",
  "slackbot",
  "telegrambot",
  "discordbot",
  "pinterest",
  "skypeuripreview",
  "redditbot",
  "embedly",
  "vkshare",
  "mastodon",
  "signal",
  "cardyb", // Bluesky
  "iframely",
  "snapchat",
  "viber",
];

export function isCrawler(userAgent: string | null): boolean {
  const ua = (userAgent ?? "").toLowerCase();
  return CRAWLERS.some((bot) => ua.includes(bot));
}

export function itemIdFromPath(pathname: string): string | null {
  return pathname.match(/^\/item\/(\d+)\/?$/)?.[1] ?? null;
}

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] ?? c,
  );

export interface Item {
  id: number;
  title: string | null;
  description: string | null;
  images: string[] | null;
  item_type: string | null;
}

// Mirrors ItemDetailHead.tsx so crawlers see what the app's <head> says.
export function renderPreview(item: Item, env: Env): string {
  const isRequest = item.item_type === "request" || item.item_type === "wish";
  const title = item.title?.trim();
  const ogTitle = title ? `${isRequest ? "Sökes" : "Piffas nu"}: ${title}` : "PIF — Pay It Forward";
  const rawDescription = item.description?.trim() ?? "";
  const description =
    rawDescription.length > 300 ? `${rawDescription.slice(0, 297)}…` : rawDescription;
  const image = item.images?.[0] || `${env.SHARE_ORIGIN}/pif-og-image.png`;
  const shareUrl = `${env.SHARE_ORIGIN}/item/${item.id}`;
  const appUrl = `${env.APP_ORIGIN}/item/${item.id}`;

  const t = escapeHtml(ogTitle);
  const d = escapeHtml(description);
  const i = escapeHtml(image);
  return `<!DOCTYPE html>
<html lang="sv">
<head>
<meta charset="utf-8">
<title>${t}</title>
<meta name="description" content="${d}">
<link rel="canonical" href="${shareUrl}">
<meta property="og:title" content="${t}">
<meta property="og:description" content="${d}">
<meta property="og:image" content="${i}">
<meta property="og:url" content="${shareUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PIF — Pay It Forward">
<meta property="og:locale" content="sv_SE">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
<meta http-equiv="refresh" content="0;url=${appUrl}">
</head>
<body><p><a href="${appUrl}">${t}</a></p></body>
</html>`;
}

async function fetchItem(id: string, env: Env): Promise<Item | null> {
  const res = await fetch(
    `${env.SUPABASE_URL}/rest/v1/items?id=eq.${id}&select=id,title,description,images,item_type&limit=1`,
    { headers: { apikey: env.SUPABASE_ANON_KEY, Authorization: `Bearer ${env.SUPABASE_ANON_KEY}` } },
  );
  if (!res.ok) {
    console.error("items fetch failed", res.status, await res.text());
    return null;
  }
  const rows = (await res.json()) as Item[];
  return rows[0] ?? null;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const target = `${env.APP_ORIGIN}${url.pathname}${url.search}`;

    if (!isCrawler(request.headers.get("User-Agent"))) {
      return Response.redirect(target, 302);
    }

    const id = itemIdFromPath(url.pathname);
    if (id && (request.method === "GET" || request.method === "HEAD")) {
      try {
        const item = await fetchItem(id, env);
        if (item) {
          return new Response(request.method === "HEAD" ? null : renderPreview(item, env), {
            headers: {
              "Content-Type": "text/html; charset=utf-8",
              // Short, so edited titles/photos show up in new previews quickly.
              "Cache-Control": "public, max-age=300",
            },
          });
        }
      } catch (e) {
        console.error("preview failed", e);
      }
      // Unknown item or Supabase trouble: fall through to the app's generic tags.
    }

    const res = await fetch(target, {
      method: request.method,
      headers: { "User-Agent": request.headers.get("User-Agent") ?? "" },
    });
    return new Response(res.body, res);
  },
};
