// Single source for which Supabase project a build talks to. Shared by the app
// (client.ts, via import.meta.env) and the build script (generate-sitemap.ts,
// via process.env/loadEnv). Defaults are PRODUCTION, so a build with no
// VITE_SUPABASE_* variables set is a production build. Staging builds set both
// variables (see .env.example).

export const PRODUCTION_SUPABASE_URL = "https://heurpehcwbhohwklqnir.supabase.co";
const PRODUCTION_SUPABASE_PUBLISHABLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldXJwZWhjd2Job2h3a2xxbmlyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM1Mjg1OTAsImV4cCI6MjA4OTEwNDU5MH0.53GF3SNG4gmwUGKNdaZx5i8PVy4f73FN7x53jna_l9w";

type Env = Record<string, string | undefined>;

export function resolveSupabaseConfig(env: Env) {
  const url = env.VITE_SUPABASE_URL || PRODUCTION_SUPABASE_URL;
  const publishableKey =
    env.VITE_SUPABASE_PUBLISHABLE_KEY || PRODUCTION_SUPABASE_PUBLISHABLE_KEY;

  // A URL override without its matching key (or vice versa) would silently
  // pair one project's URL with another's key.
  if (!!env.VITE_SUPABASE_URL !== !!env.VITE_SUPABASE_PUBLISHABLE_KEY) {
    throw new Error(
      "Set both VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY, or neither.",
    );
  }

  const projectRef = new URL(url).hostname.split(".")[0];
  return {
    url,
    publishableKey,
    // supabase-js's default auth storage key
    storageKey: `sb-${projectRef}-auth-token`,
    isStaging: url !== PRODUCTION_SUPABASE_URL,
  };
}
