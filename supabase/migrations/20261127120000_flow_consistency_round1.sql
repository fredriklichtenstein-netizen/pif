-- Pif/wish flow consistency, round 1 (Trello #141 audit, decisions by Fredrik 2026-11-27).
-- Same signatures as before (installed app builds keep working); bodies taken from the live
-- functions and changed only where noted in the comments:
-- - choosing (select_receiver / select_wish_helper) refuses archived/completed posts, the
--   chosen person gets a notification (and push), a wish helper must have offered, and the
--   helper's note is seeded into the chat only once;
-- - the giver's pif chat message names the receiver, like the wish one;
-- - the owner deselecting: the person goes back to the queue with their note (wishes used
--   to delete it); someone withdrawing themselves is removed (pifs used to keep them);
-- - deselect + archive on a pif no longer tells the receiver "Piffen är öppen igen";
-- - "Återpublicera" puts whoever was chosen back in the queue.
-- Idempotent (CREATE OR REPLACE).

CREATE OR REPLACE FUNCTION public._insert_pif_system_messages(p_conversation_id uuid, p_item_id bigint, p_owner_id uuid, p_receiver_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_title text;
  v_desc text;
  v_item_type text;
  v_item_pref text;
  v_meet_elsewhere boolean;
  v_meet_line text;
  v_item_addr text;
  v_time_window text;
  v_door_code text;
  v_floor int;
  v_instructions text;
  v_profile_pref text;
  v_profile_addr text;
  v_pref text;
  v_addr text;
  v_handover_line text;
  v_addr_line text;
  v_floor_line text;
  v_door_line text;
  v_instr_line text;
  v_time_line text;
  v_details_block text;
  v_receiver_msg text;
  v_piffer_msg text;
  v_is_wish boolean;
  v_existing int;
  v_helper_name text;
begin
  select count(*) into v_existing
    from public.messages
   where conversation_id = p_conversation_id
     and is_system_message = true;
  if v_existing > 0 then
    return;
  end if;

  select coalesce(title, ''), coalesce(description, ''), item_type,
         pickup_preference, pickup_address, preferred_time_window,
         pickup_door_code, pickup_floor, pickup_instructions, can_meet_elsewhere
    into v_title, v_desc, v_item_type, v_item_pref, v_item_addr, v_time_window,
         v_door_code, v_floor, v_instructions, v_meet_elsewhere
    from public.items
   where id = p_item_id;

  v_is_wish := (v_item_type = 'request');

  if v_is_wish then
    select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(left(last_name, 1), '')), ''), 'personen')
      into v_helper_name
      from public.profiles where id = p_receiver_id;

    v_receiver_msg :=
      'Önskaren vill gärna att du uppfyller önskan "' || v_title || '".'
      || case when btrim(coalesce(v_desc,'')) <> ''
              then E'\n\nBeskrivning: ' || v_desc
              else '' end
      || E'\n\nSkriv här till önskaren för att bekräfta detaljer.';

    v_piffer_msg :=
      'Du har valt ' || v_helper_name || ' till att uppfylla önskan "' || v_title || '".'
      || case when btrim(coalesce(v_desc,'')) <> ''
              then E'\n\nBeskrivning: ' || v_desc
              else '' end
      || E'\n\nSkriv här för att bekräfta tid och plats.';

  else
    select pickup_preference
      into v_profile_pref
      from public.profiles
     where id = p_owner_id;

    v_pref := coalesce(nullif(btrim(v_item_pref), ''), nullif(btrim(v_profile_pref), ''));
    -- Only an address the owner chose to share on this pif; no profile fallback.
    v_addr := nullif(btrim(v_item_addr), '');

    if v_pref = 'meetup' then
      v_handover_line := case when v_addr is not null
        then 'Överlämning: Ses på PIF-adressen.'
        else 'Överlämning: Ses på piffarens adress – piffaren skickar den här i chatten.' end;
    elsif v_pref = 'leave_at_door' then
      v_handover_line := case when v_addr is not null
        then 'Överlämning: Piffaren lämnar föremålet vid dörren.'
        else 'Överlämning: Piffaren lämnar föremålet vid dörren och skickar adressen här i chatten.' end;
    else
      v_handover_line := null;
    end if;

    if v_addr is not null then
      v_addr_line := 'Adress: ' || v_addr;
    end if;

    if v_floor is not null then
      v_floor_line := 'Våning: ' || v_floor::text;
    end if;

    if v_door_code is not null and btrim(v_door_code) <> '' then
      v_door_line := 'Portkod: ' || btrim(v_door_code);
    end if;

    if v_instructions is not null and btrim(v_instructions) <> '' then
      v_instr_line := 'Upphämtningsinstruktioner: ' || btrim(v_instructions);
    end if;

    if coalesce(v_meet_elsewhere, false) then
      v_meet_line := 'Piffaren kan också mötas upp på annan plats – kom överens om var här i chatten.';
    end if;

    if v_time_window is not null and btrim(v_time_window) <> '' then
      v_time_line := 'Önskad tid: ' || btrim(v_time_window);
    end if;

    v_details_block :=
         case when v_handover_line is not null then E'\n' || v_handover_line else '' end
      || case when v_addr_line     is not null then E'\n' || v_addr_line     else '' end
      || case when v_floor_line    is not null then E'\n' || v_floor_line    else '' end
      || case when v_door_line     is not null then E'\n' || v_door_line     else '' end
      || case when v_instr_line    is not null then E'\n' || v_instr_line    else '' end
      || case when v_time_line     is not null then E'\n' || v_time_line     else '' end
      || case when v_meet_line     is not null then E'\n' || v_meet_line     else '' end;

    v_receiver_msg :=
      'Du har valts som mottagare för "' || v_title || '".'
      || case when btrim(coalesce(v_desc,'')) <> ''
              then E'\n\nBeskrivning: ' || v_desc
              else '' end
      || case when v_details_block <> ''
              then E'\n' || v_details_block
              else '' end
      || E'\n\nSkriv här till piffaren för att bekräfta detaljer.';

    v_piffer_msg :=
      'Du har valt ' || coalesce((select nullif(trim(coalesce(first_name, '') || ' ' || coalesce(left(last_name, 1), '')), '') from public.profiles where id = p_receiver_id), 'en mottagare') || ' som mottagare för "' || v_title || '".'
      || case
           when v_details_block <> ''
             then E'\n\nFöljande information har skickats till mottagaren:' || v_details_block
           else E'\n\nIngen upphämtningsinformation var ifylld – komplettera direkt i chatten.'
         end
      || E'\n\nSkriv här till mottagaren för att bekräfta tid och plats.';
  end if;

  insert into public.messages
    (conversation_id, sender_id, content, is_system_message, target_user_id)
  values
    (p_conversation_id, p_owner_id, v_receiver_msg, true, p_receiver_id),
    (p_conversation_id, p_owner_id, v_piffer_msg,   true, p_owner_id);
end;
$function$;

CREATE OR REPLACE FUNCTION public.select_receiver(p_item_id bigint, p_receiver_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_owner uuid;
  v_conversation_id uuid;
  v_interest_id bigint;
  v_was_closed boolean := false;
  v_was_reselection boolean := false;
  v_existing_messages int;
  v_receiver_name text;
begin
  select user_id into v_owner from public.items where id = p_item_id for update;
  if v_owner is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized to select a receiver for this item' using errcode = '42501';
  end if;

  if exists (select 1 from public.items where id = p_item_id
             and (coalesce(pif_status, 'active') in ('completed', 'archived') or archived_at is not null)) then
    raise exception 'Item is no longer active' using errcode = '22023';
  end if;

  if exists (
    select 1 from public.interests
    where item_id = p_item_id and status = 'selected' and user_id = p_receiver_id
  ) then
    select c.id into v_conversation_id
      from public.conversations c
      join public.conversation_participants cp1
        on cp1.conversation_id = c.id and cp1.user_id = v_owner
      join public.conversation_participants cp2
        on cp2.conversation_id = c.id and cp2.user_id = p_receiver_id
     where c.item_id = p_item_id
     limit 1;
    if v_conversation_id is not null then
      update public.conversations
         set closed_at = NULL
       where id = v_conversation_id
         and closed_at is not null;
      perform public._insert_pif_system_messages(v_conversation_id, p_item_id, v_owner, p_receiver_id);
    end if;
    return jsonb_build_object('conversation_id', v_conversation_id, 'was_reselection', false);
  end if;

  if exists (
    select 1 from public.interests where item_id = p_item_id and status = 'selected'
  ) then
    raise exception 'A receiver has already been selected for this item' using errcode = '23505';
  end if;

  select id into v_interest_id from public.interests
   where item_id = p_item_id and user_id = p_receiver_id limit 1;
  if v_interest_id is null then
    raise exception 'Receiver has not expressed interest in this item' using errcode = 'P0002';
  end if;

  perform public.notify_item_interest_event(
    p_item_id, 'receiver_selected', p_receiver_id, false
  );

  update public.interests set status = 'not_selected'
   where item_id = p_item_id and id <> v_interest_id and status <> 'not_selected';

  update public.interests set status = 'selected', selected_at = now()
   where id = v_interest_id;

  select c.id into v_conversation_id
    from public.conversations c
    join public.conversation_participants cp1
      on cp1.conversation_id = c.id and cp1.user_id = v_owner
    join public.conversation_participants cp2
      on cp2.conversation_id = c.id and cp2.user_id = p_receiver_id
   where c.item_id = p_item_id
   limit 1;

  if v_conversation_id is null then
    insert into public.conversations (item_id)
      values (p_item_id)
      returning id into v_conversation_id;

    insert into public.conversation_participants (conversation_id, user_id)
      values (v_conversation_id, v_owner), (v_conversation_id, p_receiver_id);
  else
    update public.conversations
       set closed_at = NULL
     where id = v_conversation_id
       and closed_at is not null;
    v_was_closed := FOUND;
  end if;

  perform public._insert_pif_system_messages(v_conversation_id, p_item_id, v_owner, p_receiver_id);

  select count(*) into v_existing_messages from public.messages
   where conversation_id = v_conversation_id;

  v_was_reselection := (v_was_closed and v_existing_messages > 0);

  if v_was_reselection then
    select coalesce(nullif(trim(coalesce(first_name, '') || ' ' || coalesce(last_name, '')), ''), 'personen')
      into v_receiver_name
      from public.profiles where id = p_receiver_id;
    insert into public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      values
        (v_conversation_id, v_owner, 'Piffaren har valt dig på nytt att ta emot piffen.', true, p_receiver_id),
        (v_conversation_id, v_owner, 'Du har valt ' || v_receiver_name || ' på nytt som mottagare.', true, v_owner);
  end if;

  -- Tell the chosen receiver (2026-11-27): until now only the chat said so.
  perform public.create_notification(
    p_user_id => p_receiver_id,
    p_type    => 'receiver_selected',
    p_payload => jsonb_build_object(
      'title', 'Du har valts som mottagare för "' || coalesce((select title from public.items where id = p_item_id), '') || '".',
      'content', 'Öppna chatten för att bestämma hur ni ses.',
      'action_url', '/messages?conversation=' || v_conversation_id::text,
      'conversation_id', v_conversation_id,
      'reference_id', p_item_id::text, 'reference_type', 'item',
      'item_id', p_item_id,
      'item_title', (select title from public.items where id = p_item_id),
      'actor_id', v_owner));

  return jsonb_build_object('conversation_id', v_conversation_id, 'was_reselection', v_was_reselection);
end;
$function$;

CREATE OR REPLACE FUNCTION public.select_wish_helper(p_item_id bigint, p_helper_id uuid, p_note text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_conversation_id uuid;
  v_owner_id uuid;
  v_existing_messages int;
  v_seed text;
  v_was_closed boolean := false;
  v_helper_name text;
  v_reuse_path boolean := false;
  v_was_reselection boolean := false;
  v_prev_status text;
begin
  select user_id into v_owner_id from public.items where id = p_item_id for update;
  if v_owner_id is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;
  if v_owner_id <> auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if exists (select 1 from public.items where id = p_item_id
             and (coalesce(pif_status, 'active') in ('completed', 'archived') or archived_at is not null)) then
    raise exception 'Item is no longer active' using errcode = '22023';
  end if;

  select status into v_prev_status from public.interests
   where item_id = p_item_id and user_id = p_helper_id limit 1;
  if not found then
    raise exception 'Helper has not offered to help with this wish' using errcode = 'P0002';
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

  -- Seed the note once: choosing the same helper again must not repeat it.
  if v_seed is not null and not exists (
    select 1 from public.messages
     where conversation_id = v_conversation_id and sender_id = p_helper_id and content = v_seed
  ) then
    insert into public.messages (conversation_id, sender_id, content, created_at)
      values (v_conversation_id, p_helper_id, v_seed, now() + interval '1 millisecond');
  end if;

  v_was_reselection := (v_was_closed and v_existing_messages > 0);

  if v_was_reselection then
    select coalesce(nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), ''), 'den här personen') into v_helper_name
      from public.profiles where id = p_helper_id;
    insert into public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      values
        (v_conversation_id, v_owner_id, 'Önskaren har valt dig på nytt att uppfylla önskan.', true, p_helper_id),
        (v_conversation_id, v_owner_id, 'Du har valt ' || v_helper_name || ' på nytt att uppfylla önskan.', true, v_owner_id);
  end if;

  -- Tell a newly chosen helper (2026-11-27): until now only the chat said so.
  if v_prev_status is distinct from 'selected' then
    perform public.create_notification(
      p_user_id => p_helper_id,
      p_type    => 'helper_selected',
      p_payload => jsonb_build_object(
        'title', 'Du har valts att uppfylla önskan "' || coalesce((select title from public.items where id = p_item_id), '') || '".',
        'content', 'Öppna chatten för att bestämma detaljerna med önskaren.',
        'action_url', '/messages?conversation=' || v_conversation_id::text,
        'conversation_id', v_conversation_id,
        'reference_id', p_item_id::text, 'reference_type', 'item',
        'item_id', p_item_id,
        'item_title', (select title from public.items where id = p_item_id),
        'actor_id', v_owner_id));
  end if;

  return jsonb_build_object(
    'conversation_id', v_conversation_id,
    'was_reselection', v_was_reselection
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.withdraw_pif(p_item_id bigint, p_action text, p_fulfiller_id uuid DEFAULT NULL::uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid; v_item_type text; v_title text;
  v_conversation uuid; v_dropped uuid;
  v_msg_to_fulfiller text;
  v_notif_title text; v_notif_content text;
BEGIN
  IF p_action NOT IN ('reopen', 'archive') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action USING ERRCODE = '22023';
  END IF;

  SELECT user_id, item_type, title INTO v_owner, v_item_type, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;

  IF v_item_type = 'request' THEN
    IF p_fulfiller_id IS NULL THEN
      RAISE EXCEPTION 'p_fulfiller_id is required when withdrawing on a wish'
        USING ERRCODE = '22023';
    END IF;

    -- Back to the queue with the offer and note kept, like a deselected pif
    -- receiver (decided 2026-11-27); it used to be deleted.
    UPDATE public.interests SET status = 'pending', selected_at = NULL
      WHERE item_id = p_item_id AND status = 'selected' AND user_id = p_fulfiller_id;
    -- Handover confirmation is still stored per post: clear it once no helper
    -- is chosen, so the next helper's chat doesn't start as "confirmed".
    UPDATE public.items SET piffer_confirmed_handoff = false, receiver_confirmed_receipt = false
      WHERE id = p_item_id
        AND NOT EXISTS (SELECT 1 FROM public.interests WHERE item_id = p_item_id AND status = 'selected');

    SELECT c.id INTO v_conversation
      FROM public.conversations c
      JOIN public.conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.item_id = p_item_id AND cp.user_id = p_fulfiller_id
        AND c.closed_at IS NULL
      LIMIT 1;

    IF v_conversation IS NOT NULL THEN
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Önskaren har avmarkerat ditt erbjudande. Ditt erbjudande finns kvar, och önskan är fortfarande aktiv.',
          true, p_fulfiller_id);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Du har avmarkerat hjälparen. Önskan förblir aktiv.', true, v_owner);

      UPDATE public.conversations
        SET closed_at = now(), closed_reason = 'owner_withdrew_fulfiller'
        WHERE id = v_conversation AND closed_at IS NULL;
    END IF;

    v_notif_title := 'Önskaren har avmarkerat ditt erbjudande för "' || v_title || '".';
    v_notif_content := 'Ditt erbjudande finns kvar, och önskan är fortfarande aktiv.';
    PERFORM public.create_notification(
      p_user_id => p_fulfiller_id,
      p_type    => 'wish_offer_withdrew',
      p_payload => jsonb_build_object(
        'title', v_notif_title,
        'content', v_notif_content,
        'reference_id', p_item_id::text,
        'reference_type', 'item',
        'action_url', '/item/' || p_item_id::text,
        'item_id', p_item_id,
        'item_title', v_title,
        'actor_id', v_owner
      )
    );
    RETURN;
  END IF;

  SELECT user_id INTO v_dropped
    FROM public.interests
    WHERE item_id = p_item_id AND status = 'selected'
    LIMIT 1;

  -- Reset EVERYONE (the previously-selected candidate included) back to
  -- 'pending' rather than deleting the selected row -- deleting silently
  -- destroyed the withdrawn candidate's original expression of interest,
  -- while their not-selected siblings correctly kept theirs.
  UPDATE public.interests SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id AND status IN ('selected', 'not_selected');

  IF p_action = 'reopen' THEN
    UPDATE public.items SET pif_status = 'active',
      piffer_confirmed_handoff = false, receiver_confirmed_receipt = false,
      archived_at = NULL, archived_reason = NULL
      WHERE id = p_item_id;
  ELSE
    UPDATE public.items SET pif_status = 'archived',
      piffer_confirmed_handoff = false, receiver_confirmed_receipt = false,
      archived_at = now(), archived_reason = 'Piffer withdrew'
      WHERE id = p_item_id;
  END IF;

  IF v_dropped IS NOT NULL THEN
    SELECT c.id INTO v_conversation
      FROM public.conversations c
      JOIN public.conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.item_id = p_item_id AND cp.user_id = v_dropped
        AND c.closed_at IS NULL
      LIMIT 1;

    IF v_conversation IS NOT NULL THEN
      v_msg_to_fulfiller := CASE WHEN p_action = 'reopen'
        THEN 'Piffaren har avmarkerat dig som mottagare. Piffen är öppen igen för andra.'
        ELSE 'Piffaren har avmarkerat dig som mottagare och avslutat piffen.' END;

      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner, v_msg_to_fulfiller, true, v_dropped);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Du har avmarkerat mottagaren. Mottagaren har informerats.', true, v_owner);
    END IF;
  END IF;

  UPDATE public.conversations
    SET closed_at = now(), closed_reason = 'fulfiller_withdrew'
    WHERE item_id = p_item_id AND closed_at IS NULL;

  IF v_dropped IS NOT NULL THEN
    v_notif_title := 'Piffaren har avmarkerat dig som mottagare för "' || v_title || '".';
    v_notif_content := CASE WHEN p_action = 'reopen'
      THEN 'Piffen är öppen igen, och ditt intresse finns kvar.'
      ELSE 'Piffaren har avslutat piffen.' END;
    PERFORM public.create_notification(
      p_user_id => v_dropped,
      p_type    => 'interest_withdrawn',
      p_payload => jsonb_build_object(
        'title', v_notif_title,
        'content', v_notif_content,
        'reference_id', p_item_id::text,
        'reference_type', 'item',
        'action_url', '/item/' || p_item_id::text,
        'item_id', p_item_id,
        'item_title', v_title,
        'actor_id', v_owner
      )
    );
  END IF;

  PERFORM public.notify_item_interest_event(
    p_item_id, CASE WHEN p_action = 'reopen' THEN 'pif_reopened' ELSE 'pif_archived' END,
    v_dropped, false
  );
END;
$function$;

CREATE OR REPLACE FUNCTION public.withdraw_receiver(p_item_id bigint, p_comment text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_owner uuid; v_pif_status text; v_item_type text; v_title text;
  v_conversation uuid;
  v_clean_comment text := nullif(btrim(coalesce(p_comment, '')), '');
  v_msg_piffer text; v_msg_self text;
  v_is_wish boolean;
  v_closed_reason text;
  v_notif_title text; v_notif_content text;
  v_rec record;
BEGIN
  IF v_caller IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;

  SELECT user_id, pif_status, coalesce(item_type, 'offer'), title
    INTO v_owner, v_pif_status, v_item_type, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_owner = v_caller THEN RAISE EXCEPTION 'Piffer should use withdraw_pif' USING ERRCODE = '22023'; END IF;
  IF v_pif_status IN ('completed', 'archived') THEN
    RAISE EXCEPTION 'Pif is no longer active' USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.interests
    WHERE item_id = p_item_id AND user_id = v_caller AND status = 'selected'
  ) THEN
    RAISE EXCEPTION 'Not the selected receiver' USING ERRCODE = '42501';
  END IF;

  v_is_wish := lower(v_item_type) IN ('request', 'wish');
  v_closed_reason := CASE WHEN v_is_wish THEN 'fulfiller_self_withdrew' ELSE 'receiver_self_withdrew' END;

  -- Someone who withdraws themselves is removed, for pifs and wishes alike
  -- (decided 2026-11-27): they said they no longer want it. On a pif the
  -- others go back to the queue.
  DELETE FROM public.interests
    WHERE item_id = p_item_id AND user_id = v_caller AND status = 'selected';
  IF NOT v_is_wish THEN
    UPDATE public.interests
      SET status = 'pending', selected_at = NULL
      WHERE item_id = p_item_id AND status = 'not_selected';
  ELSE
    UPDATE public.items SET piffer_confirmed_handoff = false, receiver_confirmed_receipt = false
      WHERE id = p_item_id
        AND NOT EXISTS (SELECT 1 FROM public.interests WHERE item_id = p_item_id AND status = 'selected');
  END IF;

  IF NOT v_is_wish THEN
    UPDATE public.items
      SET pif_status = 'active',
          piffer_confirmed_handoff = false, receiver_confirmed_receipt = false,
          archived_at = NULL, archived_reason = NULL
      WHERE id = p_item_id;
  END IF;

  SELECT c.id INTO v_conversation
    FROM public.conversations c
    JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_owner
    JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = v_caller
    WHERE c.item_id = p_item_id
    LIMIT 1;

  IF v_conversation IS NOT NULL THEN
    UPDATE public.conversations
      SET closed_at = now(), closed_reason = v_closed_reason
      WHERE id = v_conversation AND closed_at IS NULL;

    IF v_is_wish THEN
      v_msg_piffer :=
        'Hjälparen har dragit tillbaka sitt erbjudande och kan inte längre uppfylla önskan. '
        || 'Önskan är fortfarande aktiv för andra som vill hjälpa.';
      IF v_clean_comment IS NOT NULL THEN
        v_msg_piffer := v_msg_piffer || E'\n\nHjälparens meddelande: ' || v_clean_comment;
      END IF;
      v_msg_self := 'Du har dragit tillbaka ditt erbjudande. Önskaren har informerats.';
    ELSE
      v_msg_piffer :=
        'Mottagaren har ångrat sig och kan/vill inte längre ta emot piffen. '
        || 'Piffen är nu öppen för andra att visa intresse igen.';
      IF v_clean_comment IS NOT NULL THEN
        v_msg_piffer := v_msg_piffer || E'\n\nMottagarens meddelande: ' || v_clean_comment;
      END IF;
      v_msg_self := 'Du har ångrat mottagningen. Piffaren har informerats.';
    END IF;

    INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      VALUES (v_conversation, v_caller, v_msg_piffer, true, v_owner);
    INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      VALUES (v_conversation, v_caller, v_msg_self, true, v_caller);
  END IF;

  IF v_is_wish THEN
    v_notif_title := 'Hjälparen har dragit tillbaka sitt erbjudande för "' || v_title || '".';
    v_notif_content := 'Önskan är fortfarande aktiv för andra som vill hjälpa.';
  ELSE
    v_notif_title := 'Mottagaren har ångrat sig för "' || v_title || '".';
    v_notif_content := 'Piffen är öppen igen för andra att visa intresse.';
  END IF;

  PERFORM public.create_notification(
    p_user_id => v_owner,
    p_type    => CASE WHEN v_is_wish THEN 'wish_fulfiller_withdrew' ELSE 'pif_receiver_withdrew' END,
    p_payload => jsonb_build_object(
      'title', v_notif_title,
      'content', v_notif_content,
      'reference_id', p_item_id::text,
      'reference_type', 'item',
      'action_url', '/item/' || p_item_id::text,
      'item_id', p_item_id,
      'item_title', v_title,
      'actor_id', v_caller
    )
  );

  IF NOT v_is_wish THEN
    FOR v_rec IN
      SELECT user_id FROM public.interests
      WHERE item_id = p_item_id AND user_id NOT IN (v_owner, v_caller)
    LOOP
      PERFORM public.create_notification(
        p_user_id => v_rec.user_id,
        p_type    => 'pif_reopened',
        p_payload => jsonb_build_object(
          'title', 'Piffen "' || v_title || '" är öppen igen!',
          'content', 'Du kan visa ditt intresse igen.',
          'reference_id', p_item_id::text,
          'reference_type', 'item',
          'action_url', '/item/' || p_item_id::text,
          'item_id', p_item_id,
          'item_title', v_title,
          'actor_id', v_owner
        )
      );
    END LOOP;
  END IF;

  RETURN v_conversation;
END;
$function$;

CREATE OR REPLACE FUNCTION public.restore_item(p_item_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.items WHERE id = p_item_id FOR UPDATE;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.items
    SET pif_status = 'active',
        archived_at = NULL,
        archived_reason = NULL,
        piffer_confirmed_handoff = false,
        receiver_confirmed_receipt = false,
        stale_reminder_stage = 0,
        stale_reminder_clock_start = now()
    WHERE id = p_item_id;

  -- Republishing works like "Återöppna" (decided 2026-11-27): whoever was
  -- chosen goes back to the queue, so the owner can choose again.
  UPDATE public.interests
    SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id AND status IN ('selected', 'not_selected');

  RETURN true;
END;
$function$;
