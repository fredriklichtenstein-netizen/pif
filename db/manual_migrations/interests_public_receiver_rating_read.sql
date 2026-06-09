-- Allow any authenticated user to read receiver_rating rows from interests
-- so public profile pages can compute aggregate ratings. This exposes only
-- rows where a numeric receiver_rating has been recorded.
--
-- Run manually in the Supabase SQL editor.

CREATE POLICY "Authenticated can read receiver ratings for profiles"
ON public.interests
FOR SELECT
TO authenticated
USING (receiver_rating IS NOT NULL);
