-- Trello A6: delete_own_account(p_user_id uuid) deleted whatever auth.users
-- row it was given, with no verification of who was actually asking. Not
-- currently exploitable -- only service_role could reach it, and its sole
-- caller (supabase/functions/delete-account) always authenticated the user
-- first -- but the function itself was a loaded gun: one accidental GRANT,
-- or one future caller that forgot to authenticate first, would have
-- reopened total, irreversible account deletion.
--
-- Fix (option b, the real fix rather than a sanity-check patch): the
-- function now requires auth.uid() to match p_user_id. This only works
-- because the edge function is being changed in the same deploy to call
-- this RPC using the user's OWN JWT (via the anon-key client, not the
-- service-role client) -- so auth.uid() is genuinely populated from the
-- caller's session, and the function can enforce "only ever delete
-- whoever is really, currently authenticated" regardless of what any
-- future caller does or forgets to check. This removes the risk
-- category entirely rather than mitigating it.
--
-- Same signature (p_user_id uuid), so CREATE OR REPLACE is a true replace,
-- not an additional overload -- no DROP FUNCTION needed.
CREATE OR REPLACE FUNCTION public.delete_own_account(p_user_id uuid)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'auth', 'public'
AS $function$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF auth.uid() IS NULL OR auth.uid() != p_user_id THEN
    RAISE EXCEPTION 'Not authorized to delete this account';
  END IF;

  DELETE FROM auth.users WHERE id = p_user_id;
  RETURN FOUND;
END;
$function$;

-- Now called via the user's own session (authenticated role), not
-- service_role -- service_role no longer needs execute rights, and
-- removing them closes even the theoretical "accidental compatible grant"
-- avenue further.
REVOKE EXECUTE ON FUNCTION public.delete_own_account(uuid) FROM service_role;
GRANT EXECUTE ON FUNCTION public.delete_own_account(uuid) TO authenticated;
