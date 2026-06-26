-- Manual migration — apply via Supabase SQL editor.
--
-- Based on the LIVE pg_proc body of select_wish_helper(bigint, uuid, text).
--
-- Two changes vs the live version:
--   1. REAL FIX: v_existing_messages no longer filters out system
--      messages. The reselection-message guard
--      `v_was_closed AND v_existing_messages > 0` is meant to detect
--      "this conversation has been used before" (so we know to post a
--      'valt på nytt' notice). Conversations that were withdrawn
--      typically contain ONLY system messages (selection + withdrawal),
--      so the previous filter caused the guard to evaluate false and
--      the reselection messages were silently skipped. Counting all
--      messages restores the intended behaviour.
--   2. TEMPORARY DIAGNOSTIC: [swh-reuse-diag] RAISE NOTICE lines on
--      the reuse path. To be stripped by a follow-up migration once a
--      clean test pass is captured.
--
-- Everything else is preserved verbatim from the live pg_proc output
-- (participant join via conversation_participants, FOUND-based
-- v_was_closed, _insert_pif_system_messages call).
--
-- DROP first to avoid accidental overload duplicates.

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
set search_path to 'public'
as $function$
declare
  v_conversation_id uuid;
  v_owner_id uuid;
  v_existing_messages int;
  v_seed text;
  v_was_closed boolean := false;
  v_helper_name text;
  v_reuse_path boolean := false;
begin
  select user_id into v_owner_id from public.items where id = p_item_id for update;
  if v_owner_id is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;
  if v_owner_id <> auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.interests
     set status = 'selected', selected_at = coalesce(selected_at, now())
   where item_id = p_item_id and user_id = p_helper_id;

  select c.id into v_conversation_id
    from public.conversations c
    join public.conversation_participants cp1
      on cp1.conversation_id = c.id and cp1.user_id = v_owner_id
    join public.conversation_participants cp2
      on cp2.conversation_id = c.id and cp2.user_id = p_helper_id
   where c.item_id = p_item_id
   limit 1;

  v_reuse_path := v_conversation_id is not null;
  raise notice '[swh-reuse-diag] lookup item=% helper=% owner=% conv=% reuse=%',
    p_item_id, p_helper_id, v_owner_id, v_conversation_id, v_reuse_path;

  if v_conversation_id is null then
    begin
      insert into public.conversations (item_id)
        values (p_item_id)
        returning id into v_conversation_id;
      insert into public.conversation_participants (conversation_id, user_id)
        values (v_conversation_id, v_owner_id), (v_conversation_id, p_helper_id);
    exception when unique_violation then
      select c.id into v_conversation_id
        from public.conversations c
        join public.conversation_participants cp1
          on cp1.conversation_id = c.id and cp1.user_id = v_owner_id
        join public.conversation_participants cp2
          on cp2.conversation_id = c.id and cp2.user_id = p_helper_id
       where c.item_id = p_item_id
       limit 1;
    end;
  else
    update public.conversations
       set closed_at = NULL
     where id = v_conversation_id
       and closed_at is not null;
    v_was_closed := FOUND;
    raise notice '[swh-reuse-diag] reuse-branch conv=% was_closed=%',
      v_conversation_id, v_was_closed;
  end if;

  perform public._insert_pif_system_messages(v_conversation_id, p_item_id, v_owner_id, p_helper_id);

  v_seed := coalesce(
    nullif(btrim(p_note), ''),
    (select btrim(note) from public.interests
       where item_id = p_item_id and user_id = p_helper_id
         and note is not null and btrim(note) <> ''
       limit 1)
  );

  -- FIX: count ALL messages (including system messages). A withdrawn
  -- conversation typically holds only system messages; filtering them
  -- out caused the reselection guard below to silently skip its INSERTs.
  select count(*) into v_existing_messages from public.messages
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
    select coalesce(nullif(first_name, ''), 'den här personen') into v_helper_name
      from public.profiles where id = p_helper_id;
    insert into public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      values
        (v_conversation_id, v_owner_id, 'Önskaren har valt dig på nytt att uppfylla önskan.', true, p_helper_id),
        (v_conversation_id, v_owner_id, 'Du har valt ' || v_helper_name || ' på nytt att uppfylla önskan.', true, v_owner_id);

    raise notice '[swh-reuse-diag] reselection-messages-posted conv=% helper=%',
      v_conversation_id, p_helper_id;
  end if;

  return v_conversation_id;
end;
$function$;

revoke all on function public.select_wish_helper(bigint, uuid, text) from public;
grant execute on function public.select_wish_helper(bigint, uuid, text) to authenticated;
