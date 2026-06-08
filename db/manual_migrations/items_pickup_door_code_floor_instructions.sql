-- Manual migration: add pickup_door_code and pickup_floor to items
-- (pickup_instructions already exists). Run in the Supabase SQL editor
-- BEFORE deploying the new post creation code.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS pickup_door_code text,
  ADD COLUMN IF NOT EXISTS pickup_floor integer;
