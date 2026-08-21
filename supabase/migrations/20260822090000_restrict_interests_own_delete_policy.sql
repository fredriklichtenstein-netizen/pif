-- Found live: a selected receiver withdrew and the app took a plain
-- client-side DELETE on their interests row (via withdrawPreSelectionInterest,
-- src/hooks/item/interest/withdrawPreSelection.ts) instead of calling
-- withdraw_receiver(). The "Own delete" RLS policy had no status
-- restriction, so the delete succeeded -- but a plain delete has no
-- conversation-closing or item-reset logic, unlike withdraw_receiver()'s
-- single atomic transaction. Result: the interests row vanished entirely
-- while the owner<->receiver conversation stayed open forever
-- (closed_at IS NULL), with no trigger or backstop anywhere to catch it
-- (confirmed: no DELETE trigger on interests, no trigger at all on
-- conversations).
--
-- The frontend now checks status before deleting and routes 'selected'
-- rows through withdraw_receiver() instead (see withdrawPreSelection.ts).
-- This migration adds the matching DB-side guard so that a future client
-- bug (or any other future caller of this table) structurally cannot
-- delete a selected-receiver row without going through withdraw_receiver()
-- -- the RPC is SECURITY DEFINER and bypasses RLS, so it is unaffected by
-- this restriction.

DROP POLICY IF EXISTS "Own delete" ON public.interests;

CREATE POLICY "Own delete" ON public.interests
  FOR DELETE
  USING (user_id = (SELECT auth.uid()) AND status <> 'selected');
