-- complete_onboarding() derives its default username client-side from the
-- email local-part (email.split("@")[0]). Two different real users with the
-- same local-part on different domains (john@gmail.com / john@outlook.com)
-- collide on profiles_username_key and see a raw
-- "duplicate key value violates unique constraint" error — this is a
-- genuine production risk, not just a test-data artifact (found while
-- retesting the onboarding-upsert fix on staging with
-- fredrik.lichtenstein@sustainergies.se colliding with an existing
-- fredrik.lichtenstein@gmail.com test account).
--
-- Fix: on a username collision, retry with an incrementing numeric suffix
-- inside the function, catching the actual unique_violation rather than
-- pre-checking for existence first — a pre-check has a TOCTOU race under
-- concurrent signups, whereas catching the real constraint violation and
-- retrying does not.

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
DECLARE
  v_username text := p_username;
  v_suffix integer := 1;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  LOOP
    BEGIN
      INSERT INTO public.profiles (
        id, username, first_name, last_name, avatar_url, address, city,
        location_json, phone, onboarding_completed,
        pickup_preference, pickup_address, pickup_door_code, pickup_floor, pickup_instructions
      )
      VALUES (
        auth.uid(), v_username, p_first_name, p_last_name, p_avatar_url, p_address, p_city,
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

      EXIT;
    EXCEPTION WHEN unique_violation THEN
      v_suffix := v_suffix + 1;
      v_username := p_username || v_suffix::text;
      IF v_suffix > 50 THEN
        RAISE;
      END IF;
    END;
  END LOOP;
END;
$function$;
