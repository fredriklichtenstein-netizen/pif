-- Ensure items table emits UPDATE events with full OLD row so the feed
-- realtime listener can react to pif_status transitions (archive/restore)
-- immediately for ALL connected clients, not just the actor.

-- 1) Add items to the supabase_realtime publication (idempotent).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_publication_tables
     WHERE pubname = 'supabase_realtime'
       AND schemaname = 'public'
       AND tablename = 'items'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.items';
  END IF;
END $$;

-- 2) Emit FULL OLD row on UPDATE/DELETE so listeners can compare
--    old.pif_status vs new.pif_status reliably.
ALTER TABLE public.items REPLICA IDENTITY FULL;
