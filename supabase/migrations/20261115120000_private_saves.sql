-- "Gilla" becomes "Spara" (2026-11-15). The `likes` table keeps its name
-- and now holds saves. A save is private: only the person who saved a post
-- can see that row. Everyone can still see how many have saved a post,
-- through the SECURITY DEFINER get_bulk_interaction_counts(), which only
-- returns counts.
--
-- Existing likes are removed (the owner's decision): they were given as
-- public "likes", not as private saves.
--
-- Idempotent: safe to replay on a fresh branch.

DELETE FROM public.likes;

DROP POLICY IF EXISTS "Public read" ON public.likes;
DROP POLICY IF EXISTS "Own read" ON public.likes;
CREATE POLICY "Own read" ON public.likes
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Logged-out visitors never touch the table; signed-in users only need to
-- read, add and remove their own rows (RLS above + existing insert/delete
-- policies).
REVOKE ALL ON public.likes FROM anon;
REVOKE UPDATE, TRUNCATE, REFERENCES, TRIGGER ON public.likes FROM authenticated;
GRANT SELECT, INSERT, DELETE ON public.likes TO authenticated;
