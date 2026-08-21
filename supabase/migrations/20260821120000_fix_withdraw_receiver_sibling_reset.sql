-- Bug: after a selected receiver withdraws from a pif via withdraw_receiver(),
-- only their own interests row was reset ('selected' -> 'pending'). Every
-- other candidate had already been flipped to 'not_selected' by
-- select_receiver() the first time anyone was chosen, and withdraw_receiver
-- never reset those siblings back. Result: the pif reopens (pif_status
-- back to 'active') but every other interested user is permanently stuck
-- showing the static "Inte vald" (not selected) badge in
-- InterestSelectionList.tsx, which has no click handler for that status —
-- the owner can never select a new receiver. Reported live: "Jag lyckas
-- inte välja den andra intressenten dock, står bara 'inte vald'".
--
-- withdraw_pif() (owner withdraws/reopens) already handles this correctly:
-- it resets everyone ('selected' AND 'not_selected') back to 'pending' in
-- one UPDATE, with a comment explaining exactly this reasoning. That fix
-- was never mirrored onto withdraw_receiver()'s self-withdrawal path.
-- select_receiver() itself doesn't care about status when looking up the
-- interest row to select (`where item_id = ... and user_id = ...`), so
-- this reset is purely about restoring correct UI state, not a functional
-- requirement of the select path.
--
-- Fix: on the offer/pif branch, reset ALL 'selected'/'not_selected' rows
-- for the item back to 'pending', not just the caller's own row — mirrors
-- withdraw_pif() exactly. The wish/request branch is untouched (wishes
-- support multiple simultaneous fulfillers and already DELETEs the row
-- rather than using 'not_selected' siblings).

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

  IF v_is_wish THEN
    DELETE FROM public.interests
      WHERE item_id = p_item_id AND user_id = v_caller AND status = 'selected';
  ELSE
    -- Reset EVERYONE (not just the withdrawing caller) back to 'pending',
    -- mirroring withdraw_pif() -- other candidates were only flipped to
    -- 'not_selected' because this caller got selected; that reason is gone.
    UPDATE public.interests
      SET status = 'pending', selected_at = NULL
      WHERE item_id = p_item_id AND status IN ('selected', 'not_selected');
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
    PERFORM public.notify_item_interest_event(p_item_id, 'pif_reopened', v_caller, false);
  END IF;

  RETURN v_conversation;
END;
$function$;
