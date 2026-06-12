-- Manual migration — apply via Supabase SQL editor.
-- Adds a `closed_at` flag to conversations so a single thread can be
-- marked read-only / archived without changing the underlying item's
-- pif_status (used by the receiver-withdraw flow, where the pif itself
-- is republished as 'active' but THIS conversation is closed forever).

ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS closed_at timestamptz NULL;

-- The conversations row is already covered by an UPDATE realtime feed
-- subscription in useConversations, so setting closed_at will propagate
-- to both parties without any extra wiring.
