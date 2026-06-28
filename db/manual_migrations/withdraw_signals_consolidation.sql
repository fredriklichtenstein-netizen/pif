-- =============================================================
-- Withdraw signals consolidation
-- Adds system-message + notification emission to withdraw_pif
-- and withdraw_receiver. Extends notify_item_interest_event
-- with two owner-targeted events for owner-initiated paths.
-- =============================================================

-- ---- 1. notify_item_interest_event: add interest_withdrawn + wish_offer_withdrew
DROP FUNCTION IF EXISTS public.notify_item_interest_event(bigint, text, uuid, boolean);

CREATE OR REPLACE FUNCTION public.notify_item_interest_event(
  p_item_id bigint,
  p_event text,
  p_selected_user_id uuid DEFAULT NULL,
  p_is_reselection boolean DEFAULT false
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
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
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, title, coalesce(item_type, 'offer')
    INTO v_owner, v_title, v_type
  FROM public.items WHERE id = p_item_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_owner <> v_caller THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  v_is_request := lower(v_type) IN ('request', 'wish');
  v_action_url := '/item/' || p_item_id::text;

  FOR v_rec IN
    SELECT user_id, status FROM public.interests
    WHERE item_id = p_item_id AND user_id <> v_owner
      AND (status IS NULL OR status <> 'not_selected')
  LOOP
    v_msg_title := NULL; v_msg_content := NULL; v_notif_type := p_event;

    IF p_event = 'receiver_selected' THEN
      IF p_selected_user_id IS NOT NULL AND v_rec.user_id = p_selected_user_id THEN CONTINUE;
      ELSE
        v_msg_title := 'En mottagare har valts för "' || v_title || '".';
        v_msg_content := 'Din intresseanmälan är sparad ifall piffen öppnas igen.';
      END IF;
    ELSIF p_event = 'helper_selected' THEN
      IF p_selected_user_id IS NOT NULL AND v_rec.user_id = p_selected_user_id THEN CONTINUE;
      ELSE
        v_msg_title := 'Någon har valts till att uppfylla önskan "' || v_title || '".';
        v_msg_content := 'Ditt erbjudande är sparat ifall fler behövs.';
      END IF;
    ELSIF p_event = 'pif_reopened' THEN
      IF v_rec.status = 'selected' OR (p_selected_user_id IS NOT NULL AND v_rec.user_id = p_selected_user_id) THEN CONTINUE;
      ELSE
        v_msg_title := 'Piffen "' || v_title || '" är tillgänglig igen!';
        v_msg_content := 'Du kan fortfarande hämta den.';
      END IF;
    ELSIF p_event = 'wish_reopened' THEN CONTINUE;
    ELSIF p_event = 'pif_archived' THEN
      v_msg_title := 'Piffen "' || v_title || '" har avslutats.';
    ELSIF p_event = 'wish_archived' THEN
      IF p_selected_user_id IS NOT NULL THEN CONTINUE;
      ELSE
        v_msg_title := 'Önskan "' || v_title || '" har avslutats av önskaren.';
        IF v_rec.status = 'selected' THEN v_msg_content := 'Tack för att du erbjöd din hjälp.';
        ELSE v_msg_content := 'Ditt erbjudande är sparat, men önskan är inte längre aktiv.'; END IF;
      END IF;
    ELSIF p_event = 'pif_completed' THEN CONTINUE;
    ELSIF p_event = 'wish_completed' THEN CONTINUE;

    -- NEW: owner-initiated withdraw of a previously-selected receiver (pif branch).
    -- Targets only the dropped fulfiller; siblings are handled by the implicit
    -- 'pif_reopened' broadcast that callers fire alongside this event.
    ELSIF p_event = 'interest_withdrawn' THEN
      IF p_selected_user_id IS NULL OR v_rec.user_id <> p_selected_user_id THEN CONTINUE;
      ELSE
        v_msg_title := 'Piffaren har avmarkerat dig som mottagare för "' || v_title || '".';
        v_msg_content := 'Piffen är öppen igen — du kan visa intresse på nytt om du vill.';
      END IF;

    -- NEW: owner-initiated withdraw of a previously-selected fulfiller (wish branch).
    ELSIF p_event = 'wish_offer_withdrew' THEN
      IF p_selected_user_id IS NULL OR v_rec.user_id <> p_selected_user_id THEN CONTINUE;
      ELSE
        v_msg_title := 'Önskaren har avmarkerat ditt erbjudande för "' || v_title || '".';
        v_msg_content := 'Önskan är fortfarande aktiv — andra kan fortfarande hjälpa.';
      END IF;

    ELSE
      RAISE EXCEPTION 'Unknown event: %', p_event;
    END IF;

    IF v_msg_title IS NULL THEN CONTINUE; END IF;

    v_payload := jsonb_build_object(
      'title', v_msg_title, 'content', v_msg_content,
      'reference_id', p_item_id::text, 'reference_type', 'item',
      'action_url', v_action_url, 'item_id', p_item_id,
      'item_title', v_title, 'actor_id', v_owner
    );
    PERFORM public.create_notification(
      p_user_id => v_rec.user_id, p_type => v_notif_type, p_payload => v_payload
    );
  END LOOP;
END;
$function$;

-- ---- 2. withdraw_pif: emit signals to the dropped fulfiller
DROP FUNCTION IF EXISTS public.withdraw_pif(bigint, text, uuid);

CREATE OR REPLACE FUNCTION public.withdraw_pif(
  p_item_id bigint, p_action text, p_fulfiller_id uuid DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid; v_item_type text; v_title text;
  v_conversation uuid; v_dropped uuid;
  v_msg_to_fulfiller text;
BEGIN
  IF p_action NOT IN ('reopen', 'archive') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action USING ERRCODE = '22023';
  END IF;

  SELECT user_id, item_type, title INTO v_owner, v_item_type, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_owner <> auth.uid() THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;

  -- ===== WISH branch (owner-initiated unselect of a fulfiller) =====
  IF v_item_type = 'request' THEN
    IF p_fulfiller_id IS NULL THEN
      RAISE EXCEPTION 'p_fulfiller_id is required when withdrawing on a wish'
        USING ERRCODE = '22023';
    END IF;

    DELETE FROM public.interests
      WHERE item_id = p_item_id AND status = 'selected' AND user_id = p_fulfiller_id;

    SELECT c.id INTO v_conversation
      FROM public.conversations c
      JOIN public.conversation_participants cp ON cp.conversation_id = c.id
      WHERE c.item_id = p_item_id AND cp.user_id = p_fulfiller_id
        AND c.closed_at IS NULL
      LIMIT 1;

    IF v_conversation IS NOT NULL THEN
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Önskaren har avmarkerat ditt erbjudande. Önskan är fortfarande aktiv för andra som vill hjälpa.',
          true, p_fulfiller_id);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conversation, v_owner,
          'Du har avmarkerat hjälparen. Önskan förblir aktiv.', true, v_owner);

      UPDATE public.conversations
        SET closed_at = now(), closed_reason = 'owner_withdrew_fulfiller'
        WHERE id = v_conversation AND closed_at IS NULL;
    END IF;

    PERFORM public.notify_item_interest_event(
      p_item_id, 'wish_offer_withdrew', p_fulfiller_id, false
    );
    RETURN;
  END IF;

  -- ===== PIF branch (owner-initiated unselect of the receiver) =====
  SELECT user_id INTO v_dropped
    FROM public.interests
    WHERE item_id = p_item_id AND status = 'selected'
    LIMIT 1;

  DELETE FROM public.interests WHERE item_id = p_item_id AND status = 'selected';
  UPDATE public.interests SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id AND status = 'not_selected';

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
    PERFORM public.notify_item_interest_event(
      p_item_id, 'interest_withdrawn', v_dropped, false
    );
  END IF;

  PERFORM public.notify_item_interest_event(
    p_item_id, CASE WHEN p_action = 'reopen' THEN 'pif_reopened' ELSE 'pif_archived' END,
    v_dropped, false
  );
END;
$function$;

-- ---- 3. withdraw_receiver: distinct closed_reason per item type + owner notification
DROP FUNCTION IF EXISTS public.withdraw_receiver(bigint, text);

CREATE OR REPLACE FUNCTION public.withdraw_receiver(
  p_item_id bigint, p_comment text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
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

  UPDATE public.interests
    SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id AND user_id = v_caller AND status = 'selected';

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

  -- Direct notification to the owner — bypasses notify_item_interest_event's
  -- owner-only auth gate (caller here is the receiver, not the owner).
  -- Caller legitimacy is already proven by the EXISTS gate above.
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

  RETURN v_conversation;
END;
$function$;
