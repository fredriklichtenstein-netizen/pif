-- Manual migration — apply via Supabase SQL editor.
--
-- Adds the wish-helper counterpart of submit_rating. The standard
-- submit_rating RPC infers the ratee from the *single* selected
-- interest on an item — that works for pifs, but wishes can have
-- many selected helpers, so the wisher needs to point at one
-- specific helper when rating.
--
-- Idempotent: re-rating the same helper updates the existing row
-- via an upsert keyed on (rater_id, rated_user_id, item_id).
-- Make sure that unique index/constraint exists; we add it here
-- if it isn't already present.

create unique index if not exists ratings_unique_rater_ratee_item
  on public.ratings (rater_id, rated_user_id, item_id);

create or replace function public.submit_helper_rating(
  p_item_id bigint,
  p_helper_id uuid,
  p_outcome text,
  p_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
begin
  select user_id into v_owner from public.items where id = p_item_id;
  if v_owner is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.interests
     where item_id = p_item_id
       and user_id = p_helper_id
       and status = 'selected'
  ) then
    raise exception 'helper not selected for this item'
      using errcode = 'P0002';
  end if;

  insert into public.ratings (rater_id, rated_user_id, item_id, outcome, note)
    values (auth.uid(), p_helper_id, p_item_id, p_outcome, p_note)
  on conflict (rater_id, rated_user_id, item_id)
  do update set outcome = excluded.outcome,
                note    = excluded.note;
end;
$$;

revoke all on function public.submit_helper_rating(bigint, uuid, text, text) from public;
grant execute on function public.submit_helper_rating(bigint, uuid, text, text) to authenticated;
