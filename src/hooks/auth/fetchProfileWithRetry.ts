import { supabase } from "@/integrations/supabase/client";

export interface ProfileOnboardingRow {
  onboarding_completed: boolean | null;
}

/**
 * Fetch a profile row with a short retry loop.
 * After a fresh signup the profile row is created by a DB trigger; the
 * first read can lose the race. We retry a few times before giving up so
 * the caller can reliably route to /create-profile vs. the main app.
 */
export async function fetchProfileWithRetry(
  userId: string,
  attempts = 3,
  delayMs = 400,
): Promise<ProfileOnboardingRow | null> {
  for (let i = 0; i < attempts; i++) {
    const { data, error } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .maybeSingle();
    if (!error && data) return data as ProfileOnboardingRow;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}
