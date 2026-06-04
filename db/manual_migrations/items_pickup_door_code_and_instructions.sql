-- Manual migration: add pickup_door_code and pickup_instructions to items
-- Run in the Supabase SQL editor.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS pickup_door_code text,
  ADD COLUMN IF NOT EXISTS pickup_instructions text;
