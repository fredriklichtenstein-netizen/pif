-- Pickup preference: 'meetup' was read as "meet somewhere else" (Trello E7).
-- 'meetup' now means handing over at the pif's address ("Ses på PIF-adressen");
-- the new 'meet_elsewhere' is the piffer offering to meet somewhere else, shown
-- as a "Kan mötas upp" badge on the card (Trello C18). Idempotent.

ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_pickup_preference_check;
ALTER TABLE public.items ADD CONSTRAINT items_pickup_preference_check
  CHECK (pickup_preference IS NULL OR pickup_preference = ANY (ARRAY['meetup', 'leave_at_door', 'flexible', 'meet_elsewhere']));

ALTER TABLE public.item_drafts DROP CONSTRAINT IF EXISTS item_drafts_pickup_preference_check;
ALTER TABLE public.item_drafts ADD CONSTRAINT item_drafts_pickup_preference_check
  CHECK (pickup_preference IS NULL OR pickup_preference = ANY (ARRAY['meetup', 'leave_at_door', 'flexible', 'meet_elsewhere']));

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pickup_preference_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pickup_preference_check
  CHECK (pickup_preference = ANY (ARRAY['meetup', 'leave_at_door', 'meet_elsewhere']));

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
         pickup_door_code, pickup_floor, pickup_instructions
    into v_title, v_desc, v_item_type, v_item_pref, v_item_addr, v_time_window,
         v_door_code, v_floor, v_instructions
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
    select pickup_preference, pickup_address
      into v_profile_pref, v_profile_addr
      from public.profiles
     where id = p_owner_id;

    v_pref := coalesce(nullif(btrim(v_item_pref), ''), nullif(btrim(v_profile_pref), ''));
    v_addr := coalesce(nullif(btrim(v_item_addr), ''), nullif(btrim(v_profile_addr), ''));

    if v_pref = 'meetup' then
      v_handover_line := 'Överlämning: Ses på PIF-adressen.';
    elsif v_pref = 'meet_elsewhere' then
      v_handover_line := 'Överlämning: Piffaren kan mötas upp på annan plats – kom överens om var här i chatten.';
    elsif v_pref = 'leave_at_door' then
      v_handover_line := 'Överlämning: Piffaren lämnar föremålet vid dörren.';
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

    if v_time_window is not null and btrim(v_time_window) <> '' then
      v_time_line := 'Önskad tid: ' || btrim(v_time_window);
    end if;

    v_details_block :=
         case when v_handover_line is not null then E'\n' || v_handover_line else '' end
      || case when v_addr_line     is not null then E'\n' || v_addr_line     else '' end
      || case when v_floor_line    is not null then E'\n' || v_floor_line    else '' end
      || case when v_door_line     is not null then E'\n' || v_door_line     else '' end
      || case when v_instr_line    is not null then E'\n' || v_instr_line    else '' end
      || case when v_time_line     is not null then E'\n' || v_time_line     else '' end;

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
      'Du har valt en mottagare för "' || v_title || '".'
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
