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
// - /og/<id>.webp (anyone) is the item's preview image: its first photo as a
//   1200x630 landscape crop via Supabase image transformation. Apps only show
//   the large card (image on top, text below) for a wide image of known size;
//   post photos are mostly portrait and several MB, which got the small
//   side-by-side card.
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

// Item-specific OG tags (the app itself only has generic ones in index.html).
// No <meta http-equiv="refresh">: Facebook follows it and scrapes the app's
// generic tags instead. Only crawlers ever get this page (browsers get a 302).
// Browsers open a shared post where it sits in the feed (public, like the
// item page); the app falls back to /item/<id> when it can't show it there.
// Mirrors src/lib/feedLinks.ts.
export function feedPostUrl(id: string, search: URLSearchParams, env: Env): string {
  const params = new URLSearchParams(search);
  params.delete("post");
  const rest = params.toString();
  return `${env.APP_ORIGIN}/feed?post=${id}${rest ? `&${rest}` : ""}`;
}

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

export function ogImageIdFromPath(pathname: string): string | null {
  return pathname.match(/^\/og\/(\d+)\.webp$/)?.[1] ?? null;
}

// The transformable equivalent of a public Storage URL in our own project, or
// null for anything else (external URLs can't be resized).
export function renderImageUrl(image: string, env: Env): string | null {
  const prefix = `${env.SUPABASE_URL}/storage/v1/object/public/`;
  if (!image.startsWith(prefix)) return null;
  const path = image.slice(prefix.length);
  return `${env.SUPABASE_URL}/storage/v1/render/image/public/${path}?width=${OG_WIDTH}&height=${OG_HEIGHT}&resize=cover&quality=75`;
}

// Short stable hash of the image URL, so a changed photo gets a new og:image
// URL instead of a cached old one.
const imageVersion = (s: string) => {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36);
};

export function renderPreview(item: Item, env: Env): string {
  const isRequest = item.item_type === "request" || item.item_type === "wish";
  const title = item.title?.trim();
  const ogTitle = title ? `${isRequest ? "Sökes" : "Piffas nu"}: ${title}` : "PIF — Pay It Forward";
  const rawDescription = item.description?.trim() ?? "";
  const description =
    rawDescription.length > 300 ? `${rawDescription.slice(0, 297)}…` : rawDescription;
  const photo = item.images?.[0];
  // The default image is already 1200x630; an external photo is used as is,
  // size unknown.
  const image =
    photo && renderImageUrl(photo, env)
      ? `${env.SHARE_ORIGIN}/og/${item.id}.webp?v=${imageVersion(photo)}`
      : photo || `${env.SHARE_ORIGIN}/pif-og-image.png`;
  const knownSize = !photo || !!renderImageUrl(photo, env);
  const shareUrl = `${env.SHARE_ORIGIN}/item/${item.id}`;
  const appUrl = `${env.APP_ORIGIN}/feed?post=${item.id}`;

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
${knownSize ? `<meta property="og:image:width" content="${OG_WIDTH}">
<meta property="og:image:height" content="${OG_HEIGHT}">
` : ""}<meta property="og:url" content="${shareUrl}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="PIF — Pay It Forward">
<meta property="og:locale" content="sv_SE">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${t}">
<meta name="twitter:description" content="${d}">
<meta name="twitter:image" content="${i}">
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

async function ogImage(id: string, method: string, env: Env): Promise<Response> {
  const fallback = `${env.SHARE_ORIGIN}/pif-og-image.png`;
  try {
    const item = await fetchItem(id, env);
    const photo = item?.images?.[0];
    const src = photo ? renderImageUrl(photo, env) : null;
    if (!src) return Response.redirect(photo || fallback, 302);
    // WebP explicitly: without it Supabase answers with a ~1 MB PNG. The
    // original photos are WebP already, so crawlers handle it.
    const res = await fetch(src, {
      headers: { Accept: "image/webp" },
      cf: { cacheTtl: 86400, cacheEverything: true },
    } as RequestInit);
    if (!res.ok) {
      console.error("og image transform failed", res.status);
      return Response.redirect(photo!, 302);
    }
    return new Response(method === "HEAD" ? null : res.body, {
      headers: {
        "Content-Type": res.headers.get("Content-Type") ?? "image/webp",
        // The URL carries a version of the photo, so it can be cached long.
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (e) {
    console.error("og image failed", e);
    return Response.redirect(fallback, 302);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const target = `${env.APP_ORIGIN}${url.pathname}${url.search}`;
    const id = itemIdFromPath(url.pathname);

    // Preview image: for everyone, since image fetchers don't always send a
    // crawler User-Agent.
    const ogId = ogImageIdFromPath(url.pathname);
    if (ogId && (request.method === "GET" || request.method === "HEAD")) {
      return ogImage(ogId, request.method, env);
    }

    if (!isCrawler(request.headers.get("User-Agent"))) {
      return Response.redirect(id ? feedPostUrl(id, url.searchParams, env) : target, 302);
    }

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
