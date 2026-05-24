-- Restrict access to sensitive profile columns (phone, date_of_birth).
-- The existing "Public profiles are viewable by everyone" SELECT RLS policy,
-- combined with table-level SELECT grants to the anon role, allowed
-- unauthenticated callers to read these fields. Postgres column-level
-- privileges let us scope what anon (and other users) can read without
-- changing existing RLS policies or breaking owner reads.

-- 1) Anon: revoke broad SELECT, then grant only safe columns back.
REVOKE SELECT ON public.profiles FROM anon;

GRANT SELECT (
  id,
  first_name,
  last_name,
  username,
  avatar_url,
  gender,
  coordinates,
  address,
  bio,
  onboarding_completed,
  created_at,
  updated_at
) ON public.profiles TO anon;

-- 2) Authenticated: block reads of sensitive columns from the table directly.
--    Owners should fetch their own phone/date_of_birth through a SECURITY
--    DEFINER RPC (or via the authenticated user's own row only, exposed
--    through a view/function that enforces auth.uid() = id).
REVOKE SELECT (phone, date_of_birth) ON public.profiles FROM authenticated;
