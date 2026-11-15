// Intentionally unauthenticated: browsing the map/feed is public, auth is
// only required for interacting with users/items. Do not add an auth check.
//
// Two tokens: MAPBOX_TOKEN is URL-restricted to the web origins. The native
// apps run on capacitor://localhost / https://localhost, which a URL
// restriction can never match, so they ask with { platform: "native" } and get
// MAPBOX_TOKEN_NATIVE (a separate public token without URL restrictions).
// If that secret is not set, native callers get the web token as before.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  let platform = '';
  try {
    const body = await req.json();
    if (body && typeof body.platform === 'string') platform = body.platform;
  } catch {
    // No body (every web caller): fall through to the web token.
  }

  const webToken = Deno.env.get('MAPBOX_TOKEN') ?? '';
  const nativeToken = Deno.env.get('MAPBOX_TOKEN_NATIVE') ?? '';
  const token = platform === 'native' && nativeToken ? nativeToken : webToken;

  return new Response(
    JSON.stringify({ token }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
