-- Step 3 cleanup: remove legacy point-literal columns + helper function,
-- and restore items/profiles to the default (unrestricted) realtime
-- publication so they once again broadcast all columns — now safe because
-- the troublesome string-shaped coordinates/location columns are gone.

BEGIN;

-- 1. Sanity check: every legacy column should already be fully NULL after
--    the Step 1 NULL-out. Refuse to proceed otherwise so we never lose
--    data that wasn't successfully migrated into the _json columns.
DO $$
DECLARE
  bad_items    int;
  bad_profiles int;
BEGIN
  SELECT count(*) INTO bad_items
    FROM public.items
   WHERE coordinates IS NOT NULL;
  SELECT count(*) INTO bad_profiles
    FROM public.profiles
   WHERE location IS NOT NULL;

  IF bad_items > 0 OR bad_profiles > 0 THEN
    RAISE EXCEPTION
      'Refusing to drop: items.coordinates non-null=%, profiles.location non-null=% (expected 0/0 after Step 1 NULL-out)',
      bad_items, bad_profiles;
  END IF;
END $$;

-- 2. Restore items + profiles to default publication membership (all
--    columns). The column-list ALTERs from items_realtime_exclude_coordinates
--    and profiles_realtime_exclude_location are no longer needed because
--    the offending columns are being dropped entirely.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.items';
  END IF;
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.items';

  IF EXISTS (
    SELECT 1 FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles';
  END IF;
  EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles';
END $$;

-- 3. Drop the legacy columns.
ALTER TABLE public.items    DROP COLUMN IF EXISTS coordinates;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS location;

-- 4. Drop the now-unused parser helper.
DROP FUNCTION IF EXISTS public._point_text_to_jsonb(text);

COMMIT;
