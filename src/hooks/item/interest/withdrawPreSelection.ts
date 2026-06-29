import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";

/**
 * Shared pre-selection interest withdrawal.
 *
 * Used by both the toggle-interest button (`useInterestActions.removeInterest`)
 * and the interested-users popup's non-selected candidate "Ångra" action
 * (`InterestSelectionList.handleWithdrawOwnInterest`). Keeps copy and
 * order-of-operations consistent across both entry points so the owner
 * always receives an `interest_withdrawn` notification with the same
 * shape — regardless of which UI surface the candidate withdraws from.
 *
 * Order is deliberate:
 *  1. Read item metadata (owner, title, type) BEFORE deleting, so the
 *     notification has the strings it needs even if the row is gone.
 *  2. Delete the interests row.
 *  3. Fire the notification. Failures here are logged but never thrown —
 *     a notification hiccup must not block the user-visible withdrawal.
 *
 * DEMO_MODE skips ONLY the notification RPC; the delete path runs as
 * normal (and is handled by callers in demo mode separately when needed).
 */
export const withdrawPreSelectionInterest = async (
  itemId: number,
  userId: string,
): Promise<void> => {
  // 1. Look up item metadata first — once the interests row is deleted
  // there's no harm, but we want the notification copy ready regardless.
  let ownerId: string | null = null;
  let itemTitle = "";
  let itemType = "offer";
  try {
    const { data: itemRow } = await supabase
      .from("items")
      .select("user_id, title, item_type")
      .eq("id", itemId)
      .maybeSingle();
    if (itemRow) {
      ownerId = (itemRow as any).user_id ?? null;
      itemTitle = (itemRow as any).title ?? "";
      itemType = (itemRow as any).item_type ?? "offer";
    }
  } catch (lookupErr) {
    console.warn("withdrawPreSelectionInterest: item lookup failed", lookupErr);
  }

  // 2. Delete the interests row.
  const { error } = await supabase
    .from("interests")
    .delete()
    .eq("user_id", userId)
    .eq("item_id", itemId);
  if (error) throw error;

  // 3. Notify the owner (best-effort).
  if (DEMO_MODE || !ownerId || ownerId === userId) return;

  const isWish =
    String(itemType).toLowerCase() === "request" ||
    String(itemType).toLowerCase() === "wish";
  const title = isWish
    ? `Någon har dragit tillbaka sitt erbjudande för "${itemTitle}".`
    : `Någon har dragit tillbaka sitt intresse för "${itemTitle}".`;
  const content = isWish
    ? "Önskan är fortfarande aktiv för andra som vill hjälpa."
    : "Piffen är fortfarande öppen för andra att visa intresse.";

  try {
    await (supabase.rpc as any)("create_notification", {
      p_user_id: ownerId,
      p_type: "interest_withdrawn",
      p_payload: {
        title,
        content,
        reference_id: String(itemId),
        reference_type: "item",
        action_url: `/item/${itemId}`,
        item_id: itemId,
        item_title: itemTitle,
        actor_id: userId,
      },
    });
  } catch (notifyErr) {
    console.warn("withdrawPreSelectionInterest: notification failed", notifyErr);
  }
};
