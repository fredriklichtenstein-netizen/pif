-- Migrate items.coordinates and profiles.location from "JSON string containing
-- a Postgres point-literal" (e.g. "(18.00826,59.332322)") to a real jsonb
-- object {"lng": <num>, "lat": <num>}.
--
-- Both columns are genuinely `jsonb` (typname=jsonb, oid=3802) whose stored
-- value is a JSON *string* scalar. That string is what Supabase Realtime ships
-- to the browser, which then fails JSON.parse('(...)') in
-- @supabase/realtime-js's transformers.
--
-- Strategy:
--   1. Add new sibling columns `coordinates_json` / `location_json`.
--   2. Backfill them by extracting the inner string via `#>> '{}'` (so the
--      surrounding JSON quotes are stripped) and parsing the "(lng,lat)" text.
--   3. Leave the legacy columns in place. Application writers will dual-write
--      both old + new for one release. A follow-up migration drops the old
--      columns once `[pif-trace]` reports zero warnings in production.

-- ---------- 1. Parser helper ----------------------------------------------

CREATE OR REPLACE FUNCTION public._point_text_to_jsonb(p text)
RETURNS jsonb
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  m text[];
BEGIN
  IF p IS NULL THEN RETURN NULL; END IF;
  m := regexp_match(
    p,
    '^\s*\(\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*\)\s*$'
  );
  IF m IS NULL THEN RETURN NULL; END IF;
  RETURN jsonb_build_object('lng', (m[1])::numeric, 'lat', (m[2])::numeric);
END $$;

-- ---------- 2. New columns -------------------------------------------------

ALTER TABLE public.items    ADD COLUMN IF NOT EXISTS coordinates_json jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location_json    jsonb;

-- ---------- 3. Backfill ----------------------------------------------------
-- IMPORTANT: use `#>> '{}'` (NOT `::text`) so the JSON quotes are stripped
-- before the regex runs.

UPDATE public.items
   SET coordinates_json = public._point_text_to_jsonb(coordinates #>> '{}')
 WHERE coordinates IS NOT NULL
   AND coordinates_json IS NULL;

-- profiles.location is plain `text` (typname=text, oid=25), not jsonb.
-- It stores the bare unquoted point literal directly (e.g.
-- "(18.00826,59.332322)") with no JSON-string-quote wrapping, so we pass
-- it straight to the parser without `#>> '{}'`.
UPDATE public.profiles
   SET location_json = public._point_text_to_jsonb(location)
 WHERE location IS NOT NULL
   AND location_json IS NULL;

-- ---------- 4. Diagnostics -------------------------------------------------

DO $$
DECLARE
  total_items     int;
  parsed_items    int;
  bad_items       int;
  total_profiles  int;
  parsed_profiles int;
  bad_profiles    int;
BEGIN
  SELECT count(*) INTO total_items
    FROM public.items WHERE coordinates IS NOT NULL;
  SELECT count(*) INTO parsed_items
    FROM public.items WHERE coordinates_json IS NOT NULL;
  SELECT count(*) INTO bad_items
    FROM public.items
   WHERE coordinates IS NOT NULL AND coordinates_json IS NULL;

  SELECT count(*) INTO total_profiles
    FROM public.profiles WHERE location IS NOT NULL;
  SELECT count(*) INTO parsed_profiles
    FROM public.profiles WHERE location_json IS NOT NULL;
  SELECT count(*) INTO bad_profiles
    FROM public.profiles
   WHERE location IS NOT NULL AND location_json IS NULL;

  RAISE NOTICE 'items.coordinates: % rows non-null, % parsed, % unparseable',
    total_items, parsed_items, bad_items;
  RAISE NOTICE 'profiles.location: % rows non-null, % parsed, % unparseable',
    total_profiles, parsed_profiles, bad_profiles;
END $$;
