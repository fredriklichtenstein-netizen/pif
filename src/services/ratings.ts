import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoRatingsStore, type RatingOutcome } from "@/stores/demoRatingsStore";

export type { RatingOutcome };

interface SubmitRatingArgs {
  itemId: string | number;
  outcome: RatingOutcome;
  note?: string;
  /**
   * Optional explicit ratee used by Demo Mode. In real mode this is not
   * forwarded: submit_rating resolves the selected counter-party server-side.
   */
  helperId?: string;
  /**
   * Required only in DEMO_MODE — the demo store doesn't have an auth session,
   * so callers pass the participant ids explicitly.
   */
  demoRaterId?: string;
  demoRateeId?: string;
}

/**
 * Submits a rating for an item. Hides the Demo Mode vs real backend split
 * from the UI.
 */
export async function submitRating({
  itemId,
  outcome,
  note,
  helperId,
  demoRaterId,
  demoRateeId,
}: SubmitRatingArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  if (DEMO_MODE) {
    const ratee = helperId || demoRateeId;
    if (!demoRaterId || !ratee) {
      return { ok: false, error: "Missing demo participants" };
    }
    useDemoRatingsStore.getState().submitRating({
      itemId,
      raterId: demoRaterId,
      rateeId: ratee,
      outcome,
      privateNote: note,
    });
    return { ok: true };
  }

  const itemIdNum =
    typeof itemId === "string" ? parseInt(itemId, 10) : itemId;

  // Note: submit_helper_rating does not exist in the database.
  // Both pif and wish ratings go through submit_rating, which resolves
  // the ratee via the interests table. helperId is accepted for API
  // compatibility but not forwarded — the RPC infers the ratee.
  void helperId;
  const { error } = await (supabase as any).rpc("submit_rating", {
    p_item_id: itemIdNum,
    p_outcome: outcome,
    p_note: note ?? null,
  });

  if (error) {
    console.error("submit_rating failed", error);
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

export interface UserRatingSummary {
  avg: number;
  count: number;
}

/**
 * Fetches the aggregate receiver rating for a user: the average of all
 * `receiver_rating` values in the `interests` table where this user was
 * the selected receiver. Always hits the network — not cached client-side.
 */
export async function fetchUserRatingSummary(
  userId: string,
): Promise<UserRatingSummary> {
  if (!userId) return { avg: 0, count: 0 };

  if (DEMO_MODE) {
    const records = useDemoRatingsStore
      .getState()
      .ratings.filter((r) => r.rateeId === userId && r.outcome === "positive");
    // Demo store doesn't carry numeric stars; treat each positive rating
    // as a 5 for the placeholder display.
    const count = records.length;
    const avg = count > 0 ? 5 : 0;
    return { avg, count };
  }

  const { data, error } = await (supabase.from("interests") as any)
    .select("receiver_rating")
    .eq("user_id", userId)
    .not("receiver_rating", "is", null);

  if (error) {
    console.error("fetchUserRatingSummary failed", error);
    return { avg: 0, count: 0 };
  }
  const rows = (data ?? []) as Array<{ receiver_rating: number | null }>;
  const nums = rows
    .map((r) => Number(r.receiver_rating))
    .filter((n) => Number.isFinite(n) && n > 0);
  const count = nums.length;
  const avg = count > 0 ? nums.reduce((a, b) => a + b, 0) / count : 0;
  return { avg, count };
}
