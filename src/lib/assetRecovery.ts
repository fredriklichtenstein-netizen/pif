// Recovery from "Kunde inte ladda sidan" after a deploy.
//
// Cloudflare Pages answers a missing /assets/ file with index.html (200,
// text/html). A browser that asks for a chunk or the stylesheet while a deploy
// is propagating stores that HTML under the asset's URL (Cache-Control on
// /assets/*), so a plain reload hits the same bad copy until it expires (hit
// on staging 2026-11-20 and 2026-11-24). Fetching each asset URL again with
// `cache: "reload"` bypasses the browser cache and overwrites the stored copy
// with the real file; after that a reload works.

const AUTO_KEY = "pif-asset-recovery";
const AUTO_INTERVAL_MS = 60_000;

/** Same-origin /assets/ URLs used by the page, plus any named in the error. */
export function collectAssetUrls(
  doc: Document,
  error?: unknown,
  onlyFromError = false,
): string[] {
  const urls = new Set<string>();
  const add = (raw: string | null | undefined) => {
    if (!raw) return;
    try {
      const u = new URL(raw, doc.baseURI);
      if (
        u.origin === window.location.origin &&
        u.pathname.startsWith("/assets/")
      ) {
        urls.add(u.pathname);
      }
    } catch {
      /* not a URL */
    }
  };
  if (!onlyFromError)
    doc
      .querySelectorAll<HTMLScriptElement>("script[src]")
      .forEach((s) => add(s.getAttribute("src")));
  if (!onlyFromError)
    doc
      .querySelectorAll<HTMLLinkElement>(
        'link[rel="stylesheet"][href], link[rel="modulepreload"][href]',
      )
      .forEach((l) => add(l.getAttribute("href")));
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  for (const m of message.matchAll(
    /(?:https?:\/\/[^\s'"]+)?\/assets\/[^\s'")]+/g,
  ))
    add(m[0]);
  return [...urls];
}

/** Re-download the page's assets past the browser cache, then reload. */
export async function refreshAssetsAndReload(error?: unknown): Promise<void> {
  const urls = collectAssetUrls(document, error);
  await Promise.allSettled(
    urls.map((u) => fetch(u, { cache: "reload", credentials: "same-origin" })),
  );
  window.location.reload();
}

/**
 * Do it by itself, at most once a minute per broken file (a stylesheet and a
 * chunk can each break in the same deploy). Returns false if every file named
 * was already tried in the last minute: then the error screen stays, so a real
 * outage can't cause a reload loop.
 */
export function autoRecoverOnce(
  error: unknown,
  brokenUrls: string[] = collectAssetUrls(document, error, true),
): boolean {
  try {
    const now = Date.now();
    const tried: Record<string, number> = JSON.parse(
      sessionStorage.getItem(AUTO_KEY) || "{}",
    );
    const key = brokenUrls.length ? brokenUrls : ["*"];
    const fresh = key.filter(
      (u) => !(now - (tried[u] || 0) < AUTO_INTERVAL_MS),
    );
    if (!fresh.length) return false;
    for (const u of key) tried[u] = now;
    sessionStorage.setItem(AUTO_KEY, JSON.stringify(tried));
  } catch {
    return false;
  }
  void refreshAssetsAndReload(error);
  return true;
}

/**
 * Startup checks: Vite's preload error (a lazy chunk or its CSS failed) and a
 * stylesheet that didn't apply (served as HTML, so the page shows unstyled
 * and no script error ever fires).
 */
export function installAssetRecovery(): void {
  if (typeof window === "undefined") return;
  window.addEventListener("vite:preloadError", (event) => {
    const payload = (event as Event & { payload?: unknown }).payload;
    if (autoRecoverOnce(payload)) event.preventDefault();
  });
  const checkStyles = () => {
    // An HTML page "parsed" as CSS still gives the <link> a (useless) sheet, so
    // test for something index.css defines instead.
    const hasAppStyles =
      getComputedStyle(document.documentElement)
        .getPropertyValue("--background")
        .trim() !== "";
    if (!hasAppStyles) {
      const sheets = [
        ...document.querySelectorAll<HTMLLinkElement>(
          'link[rel="stylesheet"][href]',
        ),
      ]
        .map((l) => new URL(l.href, document.baseURI).pathname)
        .filter((u) => u.startsWith("/assets/"));
      autoRecoverOnce(undefined, sheets);
    }
  };
  if (document.readyState === "complete") checkStyles();
  else window.addEventListener("load", checkStyles, { once: true });
}
