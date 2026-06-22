-- Correct profiles realtime UPDATE payloads so PostGIS `location` is never
-- emitted to Supabase Realtime clients. Raw point values like `(lng,lat)`
-- trigger client-side JSON parsing errors ("Unexpected token '('") in the
-- Supabase JS client. No realtime consumer reads profiles.location from the
-- payload — all profile-location consumers fetch via REST — so excluding
-- the column from the publication is safe.

-- Use DEFAULT replica identity so UPDATE.old contains only the primary key
-- instead of the full OLD row (which would otherwise include location).
ALTER TABLE public.profiles REPLICA IDENTITY DEFAULT;

DO $$
DECLARE
  v_columns text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO v_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name <> 'location';

  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'Could not build realtime column list for public.profiles';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'profiles'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.profiles';
  END IF;

  EXECUTE format(
    'ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles (%s)',
    v_columns
  );
END $$;
