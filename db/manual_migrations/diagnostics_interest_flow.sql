-- Run this in the Supabase SQL editor. It returns one row per check
-- with a status of OK / MISSING so you can confirm the interest flow
-- backend is fully wired up.
--
-- Read-only: makes no changes.

with checks as (
  select 'partial unique index: interests_one_selected_per_item' as check_name,
    case when exists (
      select 1 from pg_indexes
      where schemaname = 'public'
        and indexname = 'interests_one_selected_per_item'
    ) then 'OK' else 'MISSING' end as status

  union all
  select 'function: public.select_receiver(bigint, uuid)',
    case when exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'select_receiver'
    ) then 'OK' else 'MISSING' end

  union all
  select 'function: public.notify_interest_received',
    case when exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'notify_interest_received'
    ) then 'OK' else 'MISSING' end

  union all
  select 'trigger: trg_notify_interest_received on interests',
    case when exists (
      select 1 from pg_trigger
      where tgname = 'trg_notify_interest_received' and not tgisinternal
    ) then 'OK' else 'MISSING' end

  union all
  select 'function: public.notify_receiver_selected',
    case when exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public' and p.proname = 'notify_receiver_selected'
    ) then 'OK' else 'MISSING' end

  union all
  select 'trigger: trg_notify_receiver_selected on interests',
    case when exists (
      select 1 from pg_trigger
      where tgname = 'trg_notify_receiver_selected' and not tgisinternal
    ) then 'OK' else 'MISSING' end

  union all
  select 'table: public.notifications',
    case when exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'notifications'
    ) then 'OK' else 'MISSING' end

  union all
  select 'realtime: notifications in supabase_realtime publication',
    case when exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'notifications'
    ) then 'OK' else 'MISSING (run: alter publication supabase_realtime add table public.notifications;)' end

  union all
  select 'realtime: interests in supabase_realtime publication',
    case when exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = 'interests'
    ) then 'OK' else 'MISSING (run: alter publication supabase_realtime add table public.interests;)' end
)
select * from checks order by status desc, check_name;
