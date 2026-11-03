-- New interest only on active posts: completed, archived (and piffed) posts
-- no longer take "Visa intresse" / "Uppfyll". Existing interest rows are
-- untouched. Idempotent.
DROP POLICY IF EXISTS "Auth insert" ON public.interests;
CREATE POLICY "Auth insert" ON public.interests
  FOR INSERT
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.items it
      WHERE it.id = interests.item_id
        AND it.pif_status = 'active'
        AND it.archived_at IS NULL
    )
  );
