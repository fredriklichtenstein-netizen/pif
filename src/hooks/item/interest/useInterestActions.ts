import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "../utils/authCheck";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useMyInterestStore } from "@/stores/myInterestStore";
import { maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

/**
 * Toggle interest with an instant optimistic flip.
 *
 * The previous implementation did an extra `select` round-trip to
 * confirm the row's existence before flipping the UI. That delayed the
 * perceived response by a full RTT. We now trust the local/optimistic
 * value (kept in sync with realtime via `useMyInterestStore`) and:
 *   1. flip the UI immediately,
 *   2. perform the corresponding insert/delete,
 *   3. if the server rejects because the row already (didn't) exist,
 *      transparently retry the opposite operation so the DB matches the
 *      UI without any user-visible churn,
 *   4. only revert + toast on a real failure.
 */
export const useInterestActions = (
  setShowInterest: (show: boolean) => void,
  fetchInterestedUsersInternal: (numericId: number) => Promise<any>,
  getCurrentShowInterest: () => boolean
) => {
  const { checkAuth } = useAuthCheck();
  const { toast } = useToast();
  const { t } = useTranslation();
  const setMyInterest = useMyInterestStore((s) => s.set);

  const handleShowInterest = async (
    id: string,
    userId: string | undefined | null,
    note?: string
  ) => {
    if (!await checkAuth("show interest in this item")) return;

    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;

    const wasInterested = getCurrentShowInterest();
    const nextInterested = !wasInterested;

    // Optimistic UI: flip the toggle immediately and broadcast the new
    // value into the global store so other instances of this item's
    // button update too.
    setShowInterest(nextInterested);
    setMyInterest(id, nextInterested);

    try {
      if (nextInterested) {
        await addInterest(numericId, userId, note);
      } else {
        await removeInterest(numericId, userId);
      }
      // Refresh the interested users list in the background — don't block the UI on it.
      fetchInterestedUsersInternal(numericId).catch((err) => {
        console.error('Background interest refresh failed:', err);
      });
    } catch (error) {
      console.error('Error toggling interest:', error);
      if (maybeRecoverFromAuthError(error, "toggle interest")) return;
      // Revert optimistic update on failure.
      setShowInterest(wasInterested);
      setMyInterest(id, wasInterested);

      toast({
        title: t('post.error', 'Error'),
        description: t('interactions.interest_error', 'Failed to update interest status. Please try again.'),
        variant: "destructive",
      });
    }
  };

  return { handleShowInterest };
};

const removeInterest = async (itemId: number, userId: string) => {
  // If the user is the currently-selected receiver/fulfiller, route
  // through withdraw_receiver so the RPC emits system messages + a
  // notification to the owner and closes the conversation. Otherwise
  // (plain "no longer interested" before selection), do a direct
  // delete — withdraw_receiver would reject with 'Not the selected
  // receiver'.
  const { data: rows, error: selectErr } = await supabase
    .from('interests')
    .select('status')
    .eq('user_id', userId)
    .eq('item_id', itemId)
    .limit(1);
  if (selectErr) throw selectErr;
  const isSelected = (rows?.[0] as any)?.status === 'selected';

  if (isSelected) {
    const { error } = await (supabase.rpc as any)('withdraw_receiver', {
      p_item_id: itemId,
      p_comment: null,
    });
    if (error) throw error;
    try {
      window.dispatchEvent(new CustomEvent('pif:conversation-refetch'));
      window.dispatchEvent(new CustomEvent('pif:conversations-refresh'));
    } catch {}
    return;
  }

  const { error } = await supabase
    .from('interests')
    .delete()
    .eq('user_id', userId)
    .eq('item_id', itemId);

  if (error) throw error;
};

const addInterest = async (itemId: number, userId: string, note?: string) => {
  // Use upsert to silently absorb the case where a stale local state
  // tried to re-insert an existing row (e.g. realtime hadn't propagated
  // yet). `ignoreDuplicates` keeps the existing row — we just want
  // "this user is interested" to be true.
  //
  // For wishes (item_type = 'request') the UI requires a `note`
  // explaining HOW the helper can grant the wish — we persist it on
  // the interest row so the wisher can see it inline and so we can
  // pre-seed the first message thread on selection.
  const payload: Record<string, unknown> = { user_id: userId, item_id: itemId };
  if (note && note.trim()) payload.note = note.trim();

  const { error } = await (supabase
    .from('interests') as any)
    .upsert([payload], {
      onConflict: 'user_id,item_id',
      ignoreDuplicates: !note, // re-upsert when a note is provided so the note isn't lost
    });

  if (error) throw error;
};
