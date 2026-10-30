-- Pickup (Trello E7 + C18). "Mötas upp" ('meetup') was read as meeting somewhere
-- other than the pif's address; it's now worded "Ses på PIF-adressen". Being
-- willing to meet elsewhere is a separate yes/no, can_meet_elsewhere, independent
-- of the main pickup option -- it drives the "Kan mötas upp" badge on the card and
-- a line in the receiver's system message. Idempotent; also undoes the short-lived
-- 'meet_elsewhere' pickup_preference value that existed on staging only.

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS can_meet_elsewhere boolean NOT NULL DEFAULT false;
ALTER TABLE public.item_drafts ADD COLUMN IF NOT EXISTS can_meet_elsewhere boolean NOT NULL DEFAULT false;

-- items' SELECT is granted per column (public read), so new columns need it explicitly.
GRANT SELECT (can_meet_elsewhere) ON public.items TO anon, authenticated;

UPDATE public.items SET can_meet_elsewhere = true, pickup_preference = NULL WHERE pickup_preference = 'meet_elsewhere';
UPDATE public.item_drafts SET can_meet_elsewhere = true, pickup_preference = NULL WHERE pickup_preference = 'meet_elsewhere';
UPDATE public.profiles SET pickup_preference = NULL WHERE pickup_preference = 'meet_elsewhere';

ALTER TABLE public.items DROP CONSTRAINT IF EXISTS items_pickup_preference_check;
ALTER TABLE public.items ADD CONSTRAINT items_pickup_preference_check
  CHECK (pickup_preference IS NULL OR pickup_preference = ANY (ARRAY['meetup', 'leave_at_door', 'flexible']));
ALTER TABLE public.item_drafts DROP CONSTRAINT IF EXISTS item_drafts_pickup_preference_check;
ALTER TABLE public.item_drafts ADD CONSTRAINT item_drafts_pickup_preference_check
  CHECK (pickup_preference IS NULL OR pickup_preference = ANY (ARRAY['meetup', 'leave_at_door', 'flexible']));
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pickup_preference_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_pickup_preference_check
  CHECK (pickup_preference = ANY (ARRAY['meetup', 'leave_at_door']));

CREATE OR REPLACE FUNCTION public._publish_draft(p_draft_id bigint)
 RETURNS bigint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  d public.item_drafts;
  v_missing text[];
  v_item_id bigint;
BEGIN
  SELECT * INTO d FROM public.item_drafts WHERE id = p_draft_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'draft_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_missing := public._draft_missing_fields(d);
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'draft_incomplete' USING ERRCODE = 'P0001', DETAIL = array_to_string(v_missing, ',');
  END IF;

  INSERT INTO public.items (
    user_id, title, description, category, condition, item_type, pif_status,
    images, image_crops, location, coordinates_json, measurements,
    visibility_radius_km, pickup_preference, can_meet_elsewhere, pickup_address, pickup_door_code,
    pickup_instructions, pickup_floor, preferred_time_window, phone,
    created_at, stale_reminder_clock_start
  ) VALUES (
    d.user_id, btrim(d.title), d.description, d.category, d.condition, d.item_type, 'active',
    d.images, coalesce(d.image_crops, '[]'::jsonb), d.location, d.coordinates_json, d.measurements,
    d.visibility_radius_km, d.pickup_preference, d.can_meet_elsewhere, d.pickup_address, d.pickup_door_code,
    d.pickup_instructions, d.pickup_floor, d.preferred_time_window, d.phone,
    now(), now()
  )
  RETURNING id INTO v_item_id;

  DELETE FROM public.item_drafts WHERE id = p_draft_id;
  RETURN v_item_id;
END;
$function$;

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
    select pickup_preference, pickup_address
      into v_profile_pref, v_profile_addr
      from public.profiles
     where id = p_owner_id;

    v_pref := coalesce(nullif(btrim(v_item_pref), ''), nullif(btrim(v_profile_pref), ''));
    v_addr := coalesce(nullif(btrim(v_item_addr), ''), nullif(btrim(v_profile_addr), ''));

    if v_pref = 'meetup' then
      v_handover_line := 'Överlämning: Ses på PIF-adressen.';
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
