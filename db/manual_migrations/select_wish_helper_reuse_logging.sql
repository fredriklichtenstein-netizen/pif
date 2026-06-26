-- Manual migration — apply via Supabase SQL editor.
--
-- TEMPORARY DIAGNOSTIC: re-declares select_wish_helper(bigint, uuid, text)
-- with RAISE NOTICE statements in the reuse branch so we can trace exactly
-- what happens when a previously-withdrawn helper is re-selected:
--   * Did we hit the reuse branch (vs insert)?
--   * Was closed_at actually cleared (v_reopen_count)?
--   * How many messages already existed?
--   * Did the reselection-message INSERTs run?
--
-- All notices are tagged [swh-reuse-diag] for easy grepping in Supabase
-- logs. Remove this logging with a follow-up migration once the next
-- clean test sequence is captured.
--
-- DROP first to avoid creating an overload duplicate (per rule established
-- after the prior withdraw_pif incident).

drop function if exists public.select_wish_helper(bigint, uuid);
drop function if exists public.select_wish_helper(bigint, uuid, text);

create function public.select_wish_helper(
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
  v_reuse_path boolean := false;
begin
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

  select id into v_conversation_id
    from public.conversations
   where item_id = p_item_id
     and ((user1_id = v_owner_id and user2_id = p_helper_id)
       or (user1_id = p_helper_id and user2_id = v_owner_id))
   limit 1;

  v_reuse_path := v_conversation_id is not null;
  raise notice '[swh-reuse-diag] lookup item=% helper=% owner=% conv=% reuse=%',
    p_item_id, p_helper_id, v_owner_id, v_conversation_id, v_reuse_path;

  if v_conversation_id is null then
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
    update public.conversations
       set closed_at = null
     where id = v_conversation_id
       and closed_at is not null;
    get diagnostics v_reopen_count = row_count;
    v_was_closed := v_reopen_count > 0;
    raise notice '[swh-reuse-diag] reuse-branch conv=% reopen_count=% was_closed=%',
      v_conversation_id, v_reopen_count, v_was_closed;
  end if;

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

  raise notice '[swh-reuse-diag] messages conv=% existing=% seed_present=%',
    v_conversation_id, v_existing_messages, (v_seed is not null);

  if v_seed is not null and v_existing_messages = 0 then
    insert into public.messages (conversation_id, sender_id, content)
      values (v_conversation_id, p_helper_id, v_seed);
  end if;

  raise notice '[swh-reuse-diag] reselection-guard conv=% was_closed=% existing=% will_post=%',
    v_conversation_id, v_was_closed, v_existing_messages,
    (v_was_closed and v_existing_messages > 0);

  if v_was_closed and v_existing_messages > 0 then
    select coalesce(nullif(btrim(first_name), ''), 'den här personen')
      into v_helper_name
      from public.profiles
     where id = p_helper_id;
    if v_helper_name is null then
      v_helper_name := 'den här personen';
    end if;

    insert into public.messages (
      conversation_id, sender_id, content,
      is_system_message, target_user_id
    ) values (
      v_conversation_id, v_owner_id,
      'Önskaren har valt dig på nytt att uppfylla önskan.',
      true, p_helper_id
    );

    insert into public.messages (
      conversation_id, sender_id, content,
      is_system_message, target_user_id
    ) values (
      v_conversation_id, v_owner_id,
      'Du har valt ' || v_helper_name || ' på nytt att uppfylla önskan.',
      true, v_owner_id
    );

    raise notice '[swh-reuse-diag] reselection-messages-posted conv=% helper=%',
      v_conversation_id, p_helper_id;
  end if;

  return v_conversation_id;
end;
$$;

revoke all on function public.select_wish_helper(bigint, uuid, text) from public;
grant execute on function public.select_wish_helper(bigint, uuid, text) to authenticated;
