-- Manual migration: System messages for pif/wish receiver selection.
-- Run in the Supabase SQL editor.
--
-- Adds is_system_message + target_user_id columns to messages, and patches
-- select_receiver / select_wish_helper to auto-insert two Swedish system
-- messages (one for receiver, one for piffer) the first time a conversation
-- is created. System messages are inserted with read_at = now() so they
-- never count toward unread badges.

alter table public.messages
  add column if not exists is_system_message boolean not null default false,
  add column if not exists target_user_id uuid;

-- Helper that inserts the two system messages, but only when the
-- conversation has no system messages yet (idempotent across re-selects).
create or replace function public._insert_pif_system_messages(
  p_conversation_id uuid,
  p_item_id bigint,
  p_owner_id uuid,
  p_receiver_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_title text;
  v_desc text;
  v_item_pref text;
  v_item_addr text;
  v_time_window text;
  v_profile_pref text;
  v_profile_addr text;
  v_pref text;
  v_addr text;
  v_handover_line text;
  v_addr_line text;
  v_time_line text;
  v_receiver_msg text;
  v_piffer_msg text;
  v_existing int;
begin
  select count(*) into v_existing
    from public.messages
   where conversation_id = p_conversation_id
     and is_system_message = true;
  if v_existing > 0 then
    return;
  end if;

  select coalesce(title, ''), coalesce(description, ''),
         pickup_preference, pickup_address, preferred_time_window
    into v_title, v_desc, v_item_pref, v_item_addr, v_time_window
    from public.items
   where id = p_item_id;

  select pickup_preference, pickup_address
    into v_profile_pref, v_profile_addr
    from public.profiles
   where id = p_owner_id;

  v_pref := coalesce(nullif(btrim(v_item_pref), ''), nullif(btrim(v_profile_pref), ''));
  v_addr := coalesce(nullif(btrim(v_item_addr), ''), nullif(btrim(v_profile_addr), ''));

  if v_pref = 'meetup' then
    v_handover_line := 'Överlämning: Piffaren vill mötas upp.';
  elsif v_pref = 'leave_at_door' then
    v_handover_line := 'Överlämning: Piffaren lämnar föremålet vid dörren.';
  else
    v_handover_line := null;
  end if;

  if v_addr is not null then
    v_addr_line := 'Adress: ' || v_addr;
  end if;

  if v_time_window is not null and btrim(v_time_window) <> '' then
    v_time_line := 'Önskad tid: ' || btrim(v_time_window);
  end if;

  v_receiver_msg :=
    'Du har valts som mottagare för "' || v_title || '".'
    || case when btrim(coalesce(v_desc,'')) <> '' then E'\n\nOm föremålet: ' || v_desc else '' end
    || case when v_handover_line is not null then E'\n\n' || v_handover_line else '' end
    || case when v_addr_line is not null then E'\n' || v_addr_line else '' end
    || case when v_time_line is not null then E'\n' || v_time_line else '' end
    || E'\n\nKontakta piffaren för att bekräfta detaljer.';

  v_piffer_msg :=
    'Du har valt en mottagare för "' || v_title || '".'
    || E'\n\nMottagaren har fått information om upphämtningen. Kontakta mottagaren för att bekräfta tid och plats.';

  insert into public.messages
    (conversation_id, sender_id, content, is_system_message, target_user_id, read_at)
  values
    (p_conversation_id, p_owner_id, v_receiver_msg, true, p_receiver_id, now()),
    (p_conversation_id, p_owner_id, v_piffer_msg,   true, p_owner_id,    now());
end;
$$;

revoke all on function public._insert_pif_system_messages(uuid, bigint, uuid, uuid) from public;

-- Patch select_receiver to insert system messages on conversation creation/use.
create or replace function public.select_receiver(
  p_item_id bigint,
  p_receiver_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_owner uuid;
  v_conversation_id uuid;
  v_interest_id bigint;
begin
  select user_id into v_owner from public.items where id = p_item_id for update;
  if v_owner is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if v_owner <> auth.uid() then
    raise exception 'Not authorized to select a receiver for this item' using errcode = '42501';
  end if;

  if exists (
    select 1 from public.interests
    where item_id = p_item_id and status = 'selected' and user_id = p_receiver_id
  ) then
    select id into v_conversation_id from public.conversations
    where item_id = p_item_id
      and (participant_a = p_receiver_id or participant_b = p_receiver_id)
    limit 1;
    if v_conversation_id is not null then
      perform public._insert_pif_system_messages(v_conversation_id, p_item_id, v_owner, p_receiver_id);
    end if;
    return v_conversation_id;
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

  update public.interests set status = 'not_selected'
   where item_id = p_item_id and id <> v_interest_id and status <> 'not_selected';

  update public.interests set status = 'selected', selected_at = now()
   where id = v_interest_id;

  select id into v_conversation_id from public.conversations
  where item_id = p_item_id
    and ((participant_a = v_owner and participant_b = p_receiver_id)
      or (participant_a = p_receiver_id and participant_b = v_owner))
  limit 1;

  if v_conversation_id is null then
    insert into public.conversations (item_id, participant_a, participant_b)
      values (p_item_id, v_owner, p_receiver_id)
      returning id into v_conversation_id;
  end if;

  perform public._insert_pif_system_messages(v_conversation_id, p_item_id, v_owner, p_receiver_id);

  return v_conversation_id;
end;
$$;

revoke all on function public.select_receiver(bigint, uuid) from public;
grant execute on function public.select_receiver(bigint, uuid) to authenticated;

-- Patch select_wish_helper to also insert system messages.
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

  select id into v_conversation_id from public.conversations
   where item_id = p_item_id
     and ((user1_id = v_owner_id and user2_id = p_helper_id)
       or (user1_id = p_helper_id and user2_id = v_owner_id))
   limit 1;

  if v_conversation_id is null then
    begin
      insert into public.conversations (item_id, user1_id, user2_id)
        values (p_item_id, v_owner_id, p_helper_id)
        returning id into v_conversation_id;
    exception when unique_violation then
      select id into v_conversation_id from public.conversations
       where item_id = p_item_id
         and ((user1_id = v_owner_id and user2_id = p_helper_id)
           or (user1_id = p_helper_id and user2_id = v_owner_id))
       limit 1;
    end;
  end if;

  -- Insert pif system messages first time only.
  perform public._insert_pif_system_messages(v_conversation_id, p_item_id, v_owner_id, p_helper_id);

  v_seed := coalesce(
    nullif(btrim(p_note), ''),
    (select btrim(note) from public.interests
       where item_id = p_item_id and user_id = p_helper_id
         and note is not null and btrim(note) <> ''
       limit 1)
  );

  if v_seed is not null then
    select count(*) into v_existing_messages from public.messages
     where conversation_id = v_conversation_id and coalesce(is_system_message, false) = false;
    if v_existing_messages = 0 then
      insert into public.messages (conversation_id, sender_id, content)
        values (v_conversation_id, p_helper_id, v_seed);
    end if;
  end if;

  return v_conversation_id;
end;
$$;

revoke all on function public.select_wish_helper(bigint, uuid, text) from public;
grant execute on function public.select_wish_helper(bigint, uuid, text) to authenticated;
