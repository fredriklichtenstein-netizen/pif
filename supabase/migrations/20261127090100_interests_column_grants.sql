-- Interests privacy, step 2 of 2. Apply only after the app no longer reads
-- note / receiver_rating / rating_comment / owner_rating / owner_rating_comment
-- directly (it uses the functions from 20261127090000).
--
-- interests becomes readable column by column, like items: anon and
-- authenticated may SELECT who showed interest in what, its status and times,
-- but not the private columns. A new column on interests is then unreadable
-- for clients until a migration grants it.
-- INSERT / DELETE grants and all RLS policies are unchanged. Idempotent.

REVOKE SELECT ON public.interests FROM anon, authenticated;
GRANT SELECT (id, item_id, user_id, created_at, status, selected_at, item_type)
  ON public.interests TO anon, authenticated;
