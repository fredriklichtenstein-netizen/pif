-- Back-filled from production's supabase_migrations.schema_migrations (already applied
-- there as version 20260929215655); recorded here so the repo matches live.
REVOKE SELECT (last_name) ON public.profiles FROM anon;
