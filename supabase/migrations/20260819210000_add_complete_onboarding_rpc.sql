-- fe95866d (2026-08-09) revoked column-level SELECT on profiles' private
-- columns (address, phone, pickup_*, location_json) for authenticated/anon
-- to close a data leak. It didn't touch the write path: CreateProfile.tsx's
-- final onboarding step still does a raw client-side upsert() on those same
-- columns. handle_new_user() already inserts a bare profiles row on signup,
-- so that upsert always resolves via ON CONFLICT DO UPDATE — which requires
-- SELECT privilege on every column referenced in the DO UPDATE clause when
-- RLS is enabled. Since that privilege was just revoked, the upsert has
-- failed with "permission denied for table profiles" for every new signup
-- since, blocking onboarding completion entirely.
--
-- Fix: mirror the existing get_my_profile() read-side pattern with a
-- SECURITY DEFINER write path scoped internally to auth.uid(), instead of
-- re-granting SELECT on the private columns (which would reopen the leak —
-- profiles still has a dormant "Public read" USING (true) policy that only
-- stays harmless because the column grant is missing).

DROP FUNCTION IF EXISTS public.complete_onboarding(
  text, text, text, text, text, text, jsonb, text, boolean, text, text, text, integer, text
);

CREATE OR REPLACE FUNCTION public.complete_onboarding(
  p_username text,
  p_first_name text,
  p_last_name text,
  p_avatar_url text,
  p_address text,
  p_city text,
  p_location_json jsonb,
  p_phone text,
  p_onboarding_completed boolean,
  p_pickup_preference text,
  p_pickup_address text,
  p_pickup_door_code text,
  p_pickup_floor integer,
  p_pickup_instructions text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.profiles (
    id, username, first_name, last_name, avatar_url, address, city,
    location_json, phone, onboarding_completed,
    pickup_preference, pickup_address, pickup_door_code, pickup_floor, pickup_instructions
  )
  VALUES (
    auth.uid(), p_username, p_first_name, p_last_name, p_avatar_url, p_address, p_city,
    p_location_json, p_phone, p_onboarding_completed,
    p_pickup_preference, p_pickup_address, p_pickup_door_code, p_pickup_floor, p_pickup_instructions
  )
  ON CONFLICT (id) DO UPDATE SET
    username = EXCLUDED.username,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    avatar_url = EXCLUDED.avatar_url,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    location_json = EXCLUDED.location_json,
    phone = EXCLUDED.phone,
    onboarding_completed = EXCLUDED.onboarding_completed,
    pickup_preference = EXCLUDED.pickup_preference,
    pickup_address = EXCLUDED.pickup_address,
    pickup_door_code = EXCLUDED.pickup_door_code,
    pickup_floor = EXCLUDED.pickup_floor,
    pickup_instructions = EXCLUDED.pickup_instructions;
END;
$function$;

REVOKE ALL ON FUNCTION public.complete_onboarding(
  text, text, text, text, text, text, jsonb, text, boolean, text, text, text, integer, text
) FROM public;

GRANT EXECUTE ON FUNCTION public.complete_onboarding(
  text, text, text, text, text, text, jsonb, text, boolean, text, text, text, integer, text
) TO authenticated;
