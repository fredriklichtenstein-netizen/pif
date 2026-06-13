-- Correct items realtime UPDATE payloads so PostGIS `coordinates` is never
-- emitted to Supabase Realtime clients. The feed only needs id/status/archive
-- fields for archive/restore transitions; sending the raw point value can
-- trigger client-side JSON parsing errors for values like `(lng,lat)`.

-- Use DEFAULT replica identity so UPDATE.old contains only the primary key
-- instead of the full OLD row (which previously included coordinates).
ALTER TABLE public.items REPLICA IDENTITY DEFAULT;

DO $$
DECLARE
  v_columns text;
BEGIN
  SELECT string_agg(quote_ident(column_name), ', ' ORDER BY ordinal_position)
    INTO v_columns
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'items'
    AND column_name <> 'coordinates';

  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'Could not build realtime column list for public.items';
  END IF;

  IF EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime DROP TABLE public.items';
  END IF;

  EXECUTE format(
    'ALTER PUBLICATION supabase_realtime ADD TABLE public.items (%s)',
    v_columns
  );
END $$;
