-- Restrict access to sensitive pickup columns on public.items.
--
-- The existing permissive SELECT policy (USING true) plus table-level
-- SELECT grants to anon/authenticated mean any caller can issue:
--   GET /rest/v1/items?select=pickup_door_code,pickup_floor,pickup_instructions,pickup_address
-- and harvest physical-access secrets for every posted item.
--
-- Pickup details are already delivered privately to the selected receiver
-- via system messages, so the columns do not need to be readable from the
-- public REST surface at all. Postgres column-level privileges let us
-- scope this without touching existing RLS policies.
--
-- Apply this in the Supabase SQL editor.

REVOKE SELECT (pickup_door_code, pickup_floor, pickup_instructions, pickup_address)
  ON public.items FROM anon;

REVOKE SELECT (pickup_door_code, pickup_floor, pickup_instructions, pickup_address)
  ON public.items FROM authenticated;

-- service_role retains full access for edge functions / admin code paths.
