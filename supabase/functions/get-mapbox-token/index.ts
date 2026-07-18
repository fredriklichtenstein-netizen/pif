// Intentionally unauthenticated: browsing the map/feed is public, auth is
// only required for interacting with users/items. This mirrors what's
// actually been running in production — the previous version of this file
// (added an auth check via supabase.auth.getClaims()) was never actually
// deployable: that method doesn't exist on the pinned supabase-js version,
// so it would have failed on every request had it ever been deployed.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const token = Deno.env.get('MAPBOX_TOKEN') ?? '';
  return new Response(
    JSON.stringify({ token }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
});
