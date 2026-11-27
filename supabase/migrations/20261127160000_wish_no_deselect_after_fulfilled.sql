-- A wish helper who has fulfilled the wish (both confirmed their handover) can no longer be
-- deselected ("Avmarkera"), decided by Fredrik 2026-11-27. withdraw_pif from live, one guard added
-- in the wish branch. Same signature. Idempotent.

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

    -- A helper who has fulfilled the wish (both confirmed their handover)
    -- can't be deselected (decided 2026-11-27); the wisher undoes the
    -- confirmation first if it was a mistake.
    IF EXISTS (SELECT 1 FROM public.interests
                WHERE item_id = p_item_id AND user_id = p_fulfiller_id AND status = 'selected'
                  AND owner_confirmed_at IS NOT NULL AND helper_confirmed_at IS NOT NULL) THEN
      RAISE EXCEPTION 'This helper has fulfilled the wish' USING ERRCODE = '22023';
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
