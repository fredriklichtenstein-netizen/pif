// Fire-and-forget prewarm of Hado's OG prerender cache for a newly created
// or edited item. Uses a Facebook-crawler UA so Hado routes the request
// through its headless-browser prerender path and caches the rendered HTML.
//
// Called by the client from usePostFormSubmission after a successful insert
// or update, non-awaited. verify_jwt = true (see supabase/config.toml).

// deno-lint-ignore-file no-explicit-any
declare const EdgeRuntime: { waitUntil<T>(p: Promise<T>): void };

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const CANONICAL_ORIGIN = "https://app.pif.community";
const CRAWLER_UA =
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
const PREWARM_TIMEOUT_MS = 15_000;

async function prewarm(itemId: string): Promise<void> {
  const url = `${CANONICAL_ORIGIN}/item/${encodeURIComponent(itemId)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PREWARM_TIMEOUT_MS);
  const startedAt = Date.now();
  try {
    const res = await fetch(url, {
      method: "GET",
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent": CRAWLER_UA,
        "Accept": "text/html,application/xhtml+xml",
        "Cache-Control": "no-cache",
      },
    });
    // Drain body so the response is fully materialized in Hado's cache.
    const body = await res.text();
    console.log(
      `[prewarm-og] item=${itemId} status=${res.status} bytes=${body.length} ms=${
        Date.now() - startedAt
      }`,
    );
  } catch (err) {
    console.warn(
      `[prewarm-og] item=${itemId} failed after ${Date.now() - startedAt}ms:`,
      (err as Error)?.message,
    );
  } finally {
    clearTimeout(timer);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let itemId: string | undefined;
  try {
    const body = await req.json();
    const raw = body?.itemId;
    if (raw !== undefined && raw !== null) itemId = String(raw).trim();
  } catch {
    /* fall through to validation below */
  }

  if (!itemId || !/^[A-Za-z0-9_-]{1,64}$/.test(itemId)) {
    return new Response(JSON.stringify({ error: "Invalid itemId" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fire-and-forget: return 202 immediately, let the fetch finish in the
  // background via Supabase's supported EdgeRuntime.waitUntil.
  try {
    EdgeRuntime.waitUntil(prewarm(itemId));
  } catch {
    // Defensive fallback if waitUntil is unavailable at runtime for any reason.
    void prewarm(itemId);
  }

  return new Response(JSON.stringify({ ok: true, itemId }), {
    status: 202,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
