-- Manual migration — apply via Supabase SQL editor.
-- REVIEW BEFORE RUNNING.
--
-- Threads a "was_reselection" signal from select_wish_helper through
-- the frontend into notify_item_interest_event so the helper_selected
-- notification copy can distinguish a first-time selection from a
-- re-selection on a previously-withdrawn conversation.
--
-- Two functions are redefined:
--
-- 1. public.select_wish_helper(bigint, uuid, text)
--    Now RETURNS jsonb of the form
--      { "conversation_id": <uuid>, "was_reselection": <bool> }
--    where was_reselection = (reuse path AND closed_at was cleared
--    AND v_existing_messages > 0) — i.e. exactly the same predicate
--    that gates the "valt på nytt" system-message INSERTs further
--    down. The function body is otherwise verbatim from the live
--    pg_proc output shipped in select_wish_helper_reuse_logging.sql
--    (joins through conversation_participants, FOUND-based
--    v_was_closed, full-count v_existing_messages, diagnostic
--    RAISE NOTICE lines retained for one more test pass).
--
-- 2. public.notify_item_interest_event(bigint, text, uuid, boolean)
--    Adds p_is_reselection boolean DEFAULT false as the 4th
--    parameter. ONLY the helper_selected branch's
--    selected-fulfiller copy changes:
--
--      first-time (p_is_reselection = false):
--        'Önskaren vill gärna att du uppfyller önskan "X".'
--      reselection (p_is_reselection = true):
--        'Önskaren har valt dig på nytt att uppfylla önskan "X".'
--        (matches the system-message wording in select_wish_helper)
--
--    Every other branch — including the "other interested users"
--    half of helper_selected, receiver_selected, pif_reopened,
--    wish_reopened, pif_archived, wish_archived, pif_completed,
--    wish_completed, and the piffer/wisher self-notifications at the
--    bottom — is preserved BYTE-FOR-BYTE against the live pg_proc
--    body the user pasted this turn.
--
-- DROP-then-CREATE discipline per the rule established after the
-- earlier withdraw_pif overload incident. The 3-arg overload of
-- notify_item_interest_event is dropped explicitly so the new 4-arg
-- form is the only live signature.

-- ---------------------------------------------------------------
-- 1. select_wish_helper: return jsonb instead of uuid.
-- ---------------------------------------------------------------

drop function if exists public.select_wish_helper(bigint, uuid);
drop function if exists public.select_wish_helper(bigint, uuid, text);

create function public.select_wish_helper(
  p_item_id bigint,
  p_helper_id uuid,
  p_note text default null
)
returns jsonb
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
  v_was_reselection boolean := false;
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

  select count(*) into v_existing_messages from public.messages
   where conversation_id = v_conversation_id;

  raise notice '[swh-reuse-diag] messages conv=% existing=% seed_present=%',
    v_conversation_id, v_existing_messages, (v_seed is not null);

  if v_seed is not null and v_existing_messages = 0 then
    insert into public.messages (conversation_id, sender_id, content)
      values (v_conversation_id, p_helper_id, v_seed);
  end if;

  v_was_reselection := (v_was_closed and v_existing_messages > 0);

  raise notice '[swh-reuse-diag] reselection-guard conv=% was_closed=% existing=% will_post=%',
    v_conversation_id, v_was_closed, v_existing_messages, v_was_reselection;

  if v_was_reselection then
    select coalesce(nullif(first_name, ''), 'den här personen') into v_helper_name
      from public.profiles where id = p_helper_id;
    insert into public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      values
        (v_conversation_id, v_owner_id, 'Önskaren har valt dig på nytt att uppfylla önskan.', true, p_helper_id),
        (v_conversation_id, v_owner_id, 'Du har valt ' || v_helper_name || ' på nytt att uppfylla önskan.', true, v_owner_id);

    raise notice '[swh-reuse-diag] reselection-messages-posted conv=% helper=%',
      v_conversation_id, p_helper_id;
  end if;

  return jsonb_build_object(
    'conversation_id', v_conversation_id,
    'was_reselection', v_was_reselection
  );
end;
$function$;

revoke all on function public.select_wish_helper(bigint, uuid, text) from public;
grant execute on function public.select_wish_helper(bigint, uuid, text) to authenticated;

-- ---------------------------------------------------------------
-- 2. notify_item_interest_event: add p_is_reselection boolean.
-- ---------------------------------------------------------------
-- Drop the 3-arg overload explicitly so the 4-arg signature is the
-- only live version.

drop function if exists public.notify_item_interest_event(bigint, text, uuid);
drop function if exists public.notify_item_interest_event(bigint, text, uuid, boolean);

create function public.notify_item_interest_event(
  p_item_id bigint,
  p_event text,
  p_selected_user_id uuid default null,
  p_is_reselection boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_caller uuid := auth.uid();
  v_owner uuid;
  v_title text;
  v_type text;
  v_is_request boolean;
  v_rec record;
  v_payload jsonb;
  v_msg_title text;
  v_msg_content text;
  v_action_url text;
  v_notif_type text;
begin
  if v_caller is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select user_id, title, coalesce(item_type, 'offer')
    into v_owner, v_title, v_type
  from public.items
  where id = p_item_id;

  if v_owner is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if v_owner <> v_caller then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_is_request := lower(v_type) in ('request', 'wish');

  for v_rec in
    select user_id, status
    from public.interests
    where item_id = p_item_id
      and user_id <> v_owner
      and (status is null or status <> 'not_selected')
  loop
    v_msg_title := null;
    v_msg_content := null;
    v_action_url := '/item/' || p_item_id::text;
    v_notif_type := p_event;

    if p_event = 'receiver_selected' then
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        v_msg_title := 'Du har valts som mottagare för "' || v_title || '"!';
        v_msg_content := 'Öppna konversationen för att koordinera hämtning.';
        v_action_url := '/messages?item=' || p_item_id::text;
      else
        v_msg_title := 'En mottagare har valts för "' || v_title || '".';
        v_msg_content := 'Din intresseanmälan är sparad ifall piffen öppnas igen.';
      end if;

    elsif p_event = 'helper_selected' then
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        -- CHANGED: branch on p_is_reselection for the selected fulfiller.
        if p_is_reselection then
          v_msg_title := 'Önskaren har valt dig på nytt att uppfylla önskan "' || v_title || '".';
          v_msg_content := 'Öppna konversationen för att samordna.';
        else
          v_msg_title := 'Önskaren vill gärna att du uppfyller önskan "' || v_title || '".';
          v_msg_content := 'Öppna konversationen för att samordna.';
        end if;
        v_action_url := '/messages?item=' || p_item_id::text;
      else
        v_msg_title := 'Någon har valts till att uppfylla önskan "' || v_title || '".';
        v_msg_content := 'Ditt erbjudande är sparat ifall fler behövs.';
      end if;

    elsif p_event = 'pif_reopened' then
      if v_rec.status = 'selected' or (p_selected_user_id is not null and v_rec.user_id = p_selected_user_id) then
        v_msg_title := 'Piffaren har ångrat sig. Piffen "' || v_title || '" är nu öppen igen.';
      else
        v_msg_title := 'Piffen "' || v_title || '" är tillgänglig igen!';
        v_msg_content := 'Du kan fortfarande hämta den.';
      end if;

    elsif p_event = 'wish_reopened' then
      if v_rec.status = 'selected' or (p_selected_user_id is not null and v_rec.user_id = p_selected_user_id) then
        v_msg_title := 'Önskningen "' || v_title || '" är nu öppen igen.';
      else
        v_msg_title := 'Önskningen "' || v_title || '" är tillgänglig igen!';
        v_msg_content := 'Du kan fortfarande erbjuda din hjälp.';
      end if;

    elsif p_event = 'pif_archived' then
      v_msg_title := 'Piffen "' || v_title || '" har avslutats.';

    elsif p_event = 'wish_archived' then
      v_msg_title := 'Önskningen "' || v_title || '" har avslutats.';

    elsif p_event = 'pif_completed' then
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        v_msg_title := 'Piffen "' || v_title || '" är genomförd!';
        v_msg_content := 'Tack för att du tog emot.';
      else
        continue;
      end if;

    elsif p_event = 'wish_completed' then
      if p_selected_user_id is null or v_rec.user_id = p_selected_user_id or v_rec.status = 'selected' then
        v_msg_title := 'Önskningen "' || v_title || '" är uppfylld!';
        v_msg_content := 'Tack för din hjälp.';
      else
        continue;
      end if;
    else
      raise exception 'Unknown event: %', p_event;
    end if;

    if v_msg_title is null then
      continue;
    end if;

    v_payload := jsonb_build_object(
      'title', v_msg_title,
      'content', v_msg_content,
      'reference_id', p_item_id::text,
      'reference_type', 'item',
      'action_url', v_action_url,
      'item_id', p_item_id,
      'item_title', v_title,
      'actor_id', v_owner
    );

    perform public.create_notification(
      p_user_id => v_rec.user_id,
      p_type    => v_notif_type,
      p_payload => v_payload
    );
  end loop;

  if p_event = 'pif_completed' then
    perform public.create_notification(
      p_user_id => v_owner,
      p_type    => 'pif_completed',
      p_payload => jsonb_build_object(
        'title', 'Piffen "' || v_title || '" är genomförd!',
        'content', 'Bra jobbat.',
        'reference_id', p_item_id::text,
        'reference_type', 'item',
        'action_url', '/item/' || p_item_id::text,
        'item_id', p_item_id,
        'item_title', v_title
      )
    );
  elsif p_event = 'wish_completed' then
    perform public.create_notification(
      p_user_id => v_owner,
      p_type    => 'wish_completed',
      p_payload => jsonb_build_object(
        'title', 'Din önskning "' || v_title || '" är uppfylld!',
        'reference_id', p_item_id::text,
        'reference_type', 'item',
        'action_url', '/item/' || p_item_id::text,
        'item_id', p_item_id,
        'item_title', v_title
      )
    );
  end if;
end;
$function$;

revoke all on function public.notify_item_interest_event(bigint, text, uuid, boolean) from public;
grant execute on function public.notify_item_interest_event(bigint, text, uuid, boolean) to authenticated;
