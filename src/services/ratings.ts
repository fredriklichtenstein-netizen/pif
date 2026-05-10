import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoRatingsStore, type RatingOutcome } from "@/stores/demoRatingsStore";

export type { RatingOutcome };

interface SubmitRatingArgs {
  itemId: string | number;
  outcome: RatingOutcome;
  note?: string;
  /**
   * Optional explicit ratee. Required when rating a wish helper —
   * wishes can have many selected helpers so the standard
   * submit_rating RPC (which infers the single selected receiver)
   * is ambiguous. When provided, we route to submit_helper_rating.
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

  if (helperId) {
    const { error } = await (supabase as any).rpc("submit_helper_rating", {
      p_item_id: itemIdNum,
      p_helper_id: helperId,
      p_outcome: outcome,
      p_note: note ?? null,
    });
    if (error) {
      console.error("submit_helper_rating failed", error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  }

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
