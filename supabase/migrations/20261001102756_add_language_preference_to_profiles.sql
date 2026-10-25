-- Back-filled from production's supabase_migrations.schema_migrations (already applied
-- there as version 20261001102756); recorded here so the repo matches live.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS language text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'profiles_language_check'
  ) THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_language_check CHECK (language IS NULL OR language IN ('sv', 'en'));
  END IF;
END $$;

-- Column-level SELECT grants on profiles are per-column (see publicColumns.ts
-- for the full rationale) -- a newly added column has NO grant by default,
-- so without this the owner's own client-side read of their own `language`
-- would fail 42501, same as any other ungranted column. authenticated only:
-- logged-out visitors never need another user's language preference.
GRANT SELECT (language) ON public.profiles TO authenticated;
