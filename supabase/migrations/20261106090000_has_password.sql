-- Whether the signed-in user has a password. Accounts created with Google
-- sign-in have none (encrypted_password is ''); Settings offers them
-- "create a password" instead of "change password". The client can't see
-- this itself: app_metadata.providers stays ['google'] even after a
-- password is set through the recovery link.
CREATE OR REPLACE FUNCTION public.has_password()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT coalesce(u.encrypted_password, '') <> ''
  FROM auth.users u
  WHERE u.id = (SELECT auth.uid());
$$;

REVOKE ALL ON FUNCTION public.has_password() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_password() TO authenticated;
