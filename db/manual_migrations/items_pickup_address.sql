-- Add pickup_address column to items table (used by post creation pickup details)
ALTER TABLE public.items ADD COLUMN IF NOT EXISTS pickup_address text;
