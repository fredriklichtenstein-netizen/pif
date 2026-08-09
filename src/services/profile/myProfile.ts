import { supabase } from "@/integrations/supabase/client";

/**
 * Fetch the signed-in user's OWN full profile row.
 *
 * Why this exists rather than `from('profiles').select('*').eq('id', user.id)`:
 * profiles holds home addresses, exact coordinates, phone numbers and door codes,
 * and those columns are revoked from both `anon` and `authenticated` so that no
 * account can read them for anyone else. Postgres column grants are not row-aware,
 * so that revoke also blocks a user reading their own — this SECURITY DEFINER
 * function is the way back in.
 *
 * It takes no parameter and always resolves the caller from auth.uid(), so it
 * cannot be aimed at another user.
 */
export async function fetchMyProfile(options?: { signal?: AbortSignal }) {
  let query = supabase.rpc("get_my_profile");
  if (options?.signal) {
    query = query.abortSignal(options.signal) as typeof query;
  }
  const { data, error } = await query.maybeSingle();
  return { data: data as Record<string, any> | null, error };
}
