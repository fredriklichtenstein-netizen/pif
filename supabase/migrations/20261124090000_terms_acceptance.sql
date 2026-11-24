-- Terms of use acceptance (Trello "Användarvillkor", decided by Fredrik
-- 2026-11-22). The account stores which version of the terms the person
-- accepted and when. Owner-only: the columns get NO select grant (profiles is
-- readable column by column, see src/services/profile/publicColumns.ts), and
-- are read and written through the two functions below.
--
-- New accounts accept on "Skapa profil"; existing ones on a one-time screen.
-- The database-side block on posting/interest/comments/messages for people who
-- haven't accepted comes later, once the native app build has the screen
-- (installed builds without it couldn't accept otherwise).
-- Additive and idempotent.

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_version text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS terms_accepted_at timestamptz;

CREATE OR REPLACE FUNCTION public.get_my_terms_acceptance()
RETURNS TABLE (terms_version text, terms_accepted_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.terms_version, p.terms_accepted_at
  FROM public.profiles p
  WHERE p.id = (SELECT auth.uid());
$$;
REVOKE ALL ON FUNCTION public.get_my_terms_acceptance() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_my_terms_acceptance() TO authenticated;

CREATE OR REPLACE FUNCTION public.accept_terms(p_version text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL OR p_version IS NULL OR p_version !~ '^[0-9]{1,4}$' THEN
    RETURN false;
  END IF;
  UPDATE public.profiles
     SET terms_version = p_version, terms_accepted_at = now()
   WHERE id = v_uid;
  RETURN FOUND;
END;
$$;
REVOKE ALL ON FUNCTION public.accept_terms(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_terms(text) TO authenticated;
