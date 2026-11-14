import { supabase } from "@/integrations/supabase/client";

export interface UserPublicStats {
  pifsGiven: number;
  wishesFulfilled: number;
  activePosts: number;
  totalPosts: number;
  ratingAvg: number | null;
  ratingCount: number;
}

/**
 * The profile popup's numbers, computed server-side by get_user_public_stats()
 * (profiles.completed_pifs/reliability_score are not maintained, and other
 * users' receiver_rating rows aren't readable directly). Signed-in only.
 */
export async function fetchUserPublicStats(userId: string): Promise<UserPublicStats> {
  const { data, error } = await (supabase.rpc as any)("get_user_public_stats", { p_user_id: userId });
  if (error) throw error;
  const d = (data ?? {}) as Record<string, unknown>;
  const num = (v: unknown) => (typeof v === "number" ? v : Number(v ?? 0)) || 0;
  return {
    pifsGiven: num(d.pifs_given),
    wishesFulfilled: num(d.wishes_fulfilled),
    activePosts: num(d.active_posts),
    totalPosts: num(d.total_posts),
    ratingAvg: d.rating_avg == null ? null : Number(d.rating_avg),
    ratingCount: num(d.rating_count),
  };
}
