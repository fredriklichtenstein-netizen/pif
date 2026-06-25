-- Manual migration — apply via Supabase SQL editor.
--
-- Fixes two issues with select_wish_helper:
--
-- 1. When the (owner, helper, item) conversation already exists from a
--    previous selection that was later withdrawn, the conversation row
--    still carries closed_at set from that withdrawal. Re-selecting the
--    same helper was reusing the row verbatim, so the UI immediately
--    rendered the freshly-reselected thread as "closed". This migration
--    clears closed_at on the reuse branch.
--
-- 2. _insert_pif_system_messages early-returns if any system message
--    already exists in the conversation, so a reselection into a
--    previously-closed conversation produced no new timeline entry.
--    The thread read selected → withdrawn → [silence]. This migration
--    posts a single pair of targeted system messages on the reuse +
--    was-closed branch announcing the fresh selection.
--
-- Also drops the dead 2-arg overload (bigint, uuid). The only caller —
-- src/components/post/interactions/interest/InterestSelectionList.tsx —
-- always invokes the 3-arg form (passing p_note as null when no note
-- exists), so PostgREST never resolves to the 2-arg overload. Removing
-- it prevents accidental future use of the stale, no-reset behaviour.

drop function if exists public.select_wish_helper(bigint, uuid);
drop function if exists public.select_wish_helper(bigint, uuid, text);

create or replace function public.select_wish_helper(
  p_item_id bigint,
  p_helper_id uuid,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_owner_id uuid;
  v_existing_messages int;
  v_seed text;
  v_was_closed boolean := false;
  v_reopen_count int := 0;
  v_helper_name text;
begin
  -- Lock the item row so concurrent select_wish_helper calls for the
  -- same wish serialize here. This prevents two parallel re-selects
  -- from each seeing "no conversation yet" and racing to create one.
  select user_id into v_owner_id
    from public.items
   where id = p_item_id
   for update;
  if v_owner_id is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;
  if v_owner_id <> auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.interests
     set status = 'selected',
         selected_at = coalesce(selected_at, now())
   where item_id = p_item_id
     and user_id = p_helper_id;

  -- Reuse the existing conversation if one already exists for this
  -- (item, owner, helper) triple — never create a duplicate.
  select id into v_conversation_id
    from public.conversations
   where item_id = p_item_id
     and ((user1_id = v_owner_id and user2_id = p_helper_id)
       or (user1_id = p_helper_id and user2_id = v_owner_id))
   limit 1;

  if v_conversation_id is null then
    -- The unique index `conversations_unique_pair_per_item` guarantees
    -- only one row can win. If a competing transaction inserted the
    -- pair just before us, the unique violation is recovered from by
    -- re-reading the row they committed.
    begin
      insert into public.conversations (item_id, user1_id, user2_id)
        values (p_item_id, v_owner_id, p_helper_id)
        returning id into v_conversation_id;
    exception when unique_violation then
      select id into v_conversation_id
        from public.conversations
       where item_id = p_item_id
         and ((user1_id = v_owner_id and user2_id = p_helper_id)
           or (user1_id = p_helper_id and user2_id = v_owner_id))
       limit 1;
    end;
  else
    -- Reuse path: if the conversation was closed by a previous
    -- withdrawal, reopen it. Track whether we actually reopened so we
    -- can post a "reselected" system message below.
    update public.conversations
       set closed_at = null
     where id = v_conversation_id
       and closed_at is not null;
    get diagnostics v_reopen_count = row_count;
    v_was_closed := v_reopen_count > 0;
  end if;

  -- Seed the helper's note as the first message, but only when the
  -- conversation has no messages yet. Without this guard, repeated
  -- calls would stack identical seed messages.
  v_seed := coalesce(
    nullif(btrim(p_note), ''),
    (select btrim(note) from public.interests
       where item_id = p_item_id and user_id = p_helper_id
         and note is not null and btrim(note) <> ''
       limit 1)
  );

  select count(*) into v_existing_messages
    from public.messages
   where conversation_id = v_conversation_id;

  if v_seed is not null and v_existing_messages = 0 then
    insert into public.messages (conversation_id, sender_id, content)
      values (v_conversation_id, p_helper_id, v_seed);
  end if;

  -- Reselection announcement: only on the reuse+was-closed path AND
  -- only when the seed-message branch did NOT just post (i.e. existing
  -- messages > 0). Otherwise the timeline would read selected →
  -- withdrawn → [silence], even though a brand-new selection happened.
  if v_was_closed and v_existing_messages > 0 then
    select coalesce(nullif(btrim(first_name), ''), 'den här personen')
      into v_helper_name
      from public.profiles
     where id = p_helper_id;
    if v_helper_name is null then
      v_helper_name := 'den här personen';
    end if;

    -- Targeted message to the helper.
    insert into public.messages (
      conversation_id, sender_id, content,
      is_system_message, target_user_id
    ) values (
      v_conversation_id, v_owner_id,
      'Önskaren har valt dig på nytt att uppfylla önskan.',
      true, p_helper_id
    );

    -- Targeted message to the owner.
    insert into public.messages (
      conversation_id, sender_id, content,
      is_system_message, target_user_id
    ) values (
      v_conversation_id, v_owner_id,
      'Du har valt ' || v_helper_name || ' på nytt att uppfylla önskan.',
      true, v_owner_id
    );
  end if;

  return v_conversation_id;
end;
$$;

revoke all on function public.select_wish_helper(bigint, uuid, text) from public;
grant execute on function public.select_wish_helper(bigint, uuid, text) to authenticated;
