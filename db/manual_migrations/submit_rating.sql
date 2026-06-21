-- Manual migration — apply via Supabase SQL editor.
--
-- Creates the submit_rating RPC used by PifferRatingDialog for single-
-- receiver items (pifs). Mirrors submit_helper_rating but resolves the
-- ratee automatically from the item's conversation (which pins the
-- piffer/receiver pair at selection time and survives later status
-- transitions like 'piffed' / 'completed').
--
-- Idempotent: upserts on (rater_id, rated_user_id, item_id).

create unique index if not exists ratings_unique_rater_ratee_item
  on public.ratings (rater_id, rated_user_id, item_id);

create or replace function public.submit_rating(
  p_item_id bigint,
  p_outcome text,
  p_note    text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_piffer   uuid;
  v_receiver uuid;
begin
  select user_id into v_piffer
  from public.items
  where id = p_item_id
  for update;

  if v_piffer is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;

  if v_piffer <> auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  -- Primary lookup: the receiver is the other participant of the pif's
  -- conversation. Stable across status transitions.
  select case
           when participant_a = v_piffer then participant_b
           else participant_a
         end
    into v_receiver
  from public.conversations
  where item_id = p_item_id
  order by created_at asc
  limit 1;

  -- Fallback: any non-piffer interest row, preferring still-selected.
  if v_receiver is null then
    select user_id into v_receiver
    from public.interests
    where item_id = p_item_id
      and user_id <> v_piffer
    order by (status = 'selected') desc,
             selected_at desc nulls last,
             created_at desc
    limit 1;
  end if;

  if v_receiver is null then
    raise exception 'no receiver found for this item' using errcode = 'P0002';
  end if;

  insert into public.ratings (rater_id, rated_user_id, item_id, outcome, note)
    values (auth.uid(), v_receiver, p_item_id, p_outcome, p_note)
  on conflict (rater_id, rated_user_id, item_id)
  do update set outcome = excluded.outcome,
                note    = excluded.note;
end;
$$;

revoke all on function public.submit_rating(bigint, text, text) from public;
grant execute on function public.submit_rating(bigint, text, text) to authenticated;
