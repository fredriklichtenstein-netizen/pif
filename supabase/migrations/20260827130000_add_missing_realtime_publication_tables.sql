-- Corrective migration: supabase_realtime publication membership is not
-- captured by migration replay (same category of gap as storage buckets,
-- see add_missing_storage_buckets_and_policies) -- it was built up on
-- production manually/via dashboard over time and never recorded as a
-- tracked migration. A fresh Supabase branch (e.g. staging) therefore
-- starts with only whatever a tracked migration happened to add
-- explicitly (just `conversations`), silently missing realtime delivery
-- on every other table.
--
-- Found live: messages sent in a conversation never appeared for the
-- recipient until a full page refresh (which re-fetches from Postgres
-- directly, bypassing realtime). The INSERT itself always succeeded --
-- only the postgres_changes notification was never delivered, because
-- `public.messages` was not a member of the `supabase_realtime`
-- publication on staging. Likely affected other tables' live-update UX
-- too (comments, likes, notifications, etc.), just not yet noticed.
--
-- ALTER PUBLICATION ... ADD TABLE has no IF NOT EXISTS clause and errors
-- on a table that's already a member, so this is wrapped in a DO block
-- that checks pg_publication_rel first -- safe to run against an
-- environment (like production) that already has some or all of these,
-- and safe to replay on every future fresh branch.
DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN
    SELECT unnest(ARRAY[
      'comment_likes',
      'comments',
      'conversations',
      'interests',
      'items',
      'likes',
      'messages',
      'notifications',
      'profiles'
    ])
  LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_publication_rel pr
      JOIN pg_class c ON c.oid = pr.prrelid
      JOIN pg_publication p ON p.oid = pr.prpubid
      WHERE p.pubname = 'supabase_realtime'
        AND c.relname = tbl
        AND c.relnamespace = 'public'::regnamespace
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', tbl);
    END IF;
  END LOOP;
END $$;
