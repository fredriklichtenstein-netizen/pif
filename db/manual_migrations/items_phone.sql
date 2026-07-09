-- Manual migration: add phone to items so per-post opt-in phone sharing
-- (from the pif creation form's pickup-details section) can be persisted.
-- Run in the Supabase SQL editor.
--
-- items.phone is PII. It is delivered privately to the selected receiver via
-- system messages, so we mirror db/manual_migrations/restrict_items_pickup_secrets.sql
-- and revoke public read access on this column.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS phone text;

REVOKE SELECT (phone) ON public.items FROM anon;
REVOKE SELECT (phone) ON public.items FROM authenticated;

-- service_role retains full access for edge functions / admin code paths.
