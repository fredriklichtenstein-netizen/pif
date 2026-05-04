import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoRatingsStore, type RatingOutcome } from "@/stores/demoRatingsStore";

export type { RatingOutcome };

interface SubmitRatingArgs {
  itemId: string | number;
  outcome: RatingOutcome;
  note?: string;
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
  demoRaterId,
  demoRateeId,
}: SubmitRatingArgs): Promise<{ ok: true } | { ok: false; error: string }> {
  if (DEMO_MODE) {
    if (!demoRaterId || !demoRateeId) {
      return { ok: false, error: "Missing demo participants" };
    }
    useDemoRatingsStore.getState().submitRating({
      itemId,
      raterId: demoRaterId,
      rateeId: demoRateeId,
      outcome,
      privateNote: note,
    });
    return { ok: true };
  }

  const itemIdNum =
    typeof itemId === "string" ? parseInt(itemId, 10) : itemId;

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
