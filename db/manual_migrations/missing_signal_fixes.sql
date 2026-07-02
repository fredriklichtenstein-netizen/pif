-- =============================================================
-- missing_signal_fixes.sql
--
-- Three high-priority signal gaps closed in one migration:
--   1. delete_item_with_related_records: emit SMs + close open
--      conversations + fan-out pif_archived/wish_archived N BEFORE
--      the cascade delete.
--   2. archive_item: emit SMs + close open conversations BEFORE
--      flipping pif_status='archived'. Client-side fan-out N stays.
--   3. withdraw_receiver (pif branch): add pif_reopened fan-out N
--      to other candidates, excluding the withdrawing receiver.
--
-- Also: add SET search_path TO 'public' to archive_item and
-- delete_item_with_related_records (currently missing).
-- =============================================================

-- -------------------------------------------------------------
-- GAP 2: archive_item
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.archive_item(bigint, text);

CREATE OR REPLACE FUNCTION public.archive_item(
  p_item_id bigint, p_reason text DEFAULT NULL::text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_owner uuid; v_item_type text; v_title text;
  v_is_wish boolean;
  v_conv record;
  v_other uuid;
  v_msg_other text; v_msg_owner text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, coalesce(item_type, 'offer'), title
    INTO v_owner, v_item_type, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN
    RETURN false;
  END IF;
  IF v_owner <> v_caller THEN
    RAISE EXCEPTION 'Only the owner can archive this item' USING ERRCODE = '42501';
  END IF;

  v_is_wish := lower(v_item_type) IN ('request', 'wish');

  -- Emit SMs + close every open conversation for this item.
  FOR v_conv IN
    SELECT c.id
      FROM public.conversations c
      WHERE c.item_id = p_item_id AND c.closed_at IS NULL
  LOOP
    SELECT cp.user_id INTO v_other
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = v_conv.id AND cp.user_id <> v_owner
      LIMIT 1;

    IF v_other IS NOT NULL THEN
      IF v_is_wish THEN
        v_msg_other := 'Önskaren har arkiverat önskan "' || v_title || '". Konversationen är avslutad.';
        v_msg_owner := 'Du har arkiverat önskan. Hjälparen har informerats.';
      ELSE
        v_msg_other := 'Piffaren har arkiverat piffen "' || v_title || '". Konversationen är avslutad.';
        v_msg_owner := 'Du har arkiverat piffen. Mottagaren har informerats.';
      END IF;

      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conv.id, v_owner, v_msg_other, true, v_other);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conv.id, v_owner, v_msg_owner, true, v_owner);
    END IF;

    UPDATE public.conversations
      SET closed_at = now(), closed_reason = 'owner_archived'
      WHERE id = v_conv.id AND closed_at IS NULL;
  END LOOP;

  -- Preserve existing behavior byte-for-byte.
  UPDATE items
  SET pif_status      = 'archived',
      archived_at     = now(),
      archived_reason = p_reason
  WHERE id = p_item_id AND user_id = auth.uid();

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.archive_item(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.archive_item(bigint, text) TO authenticated;


-- -------------------------------------------------------------
-- GAP 1: delete_item_with_related_records
-- -------------------------------------------------------------
DROP FUNCTION IF EXISTS public.delete_item_with_related_records(bigint, text);

CREATE OR REPLACE FUNCTION public.delete_item_with_related_records(
  p_item_id bigint, p_reason text DEFAULT NULL::text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_owner uuid; v_item_type text; v_title text;
  v_is_wish boolean;
  v_conv record;
  v_other uuid;
  v_msg_other text; v_msg_owner text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, coalesce(item_type, 'offer'), title
    INTO v_owner, v_item_type, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN
    RETURN false;
  END IF;
  IF v_owner <> v_caller THEN
    RAISE EXCEPTION 'Only the owner can delete this item' USING ERRCODE = '42501';
  END IF;

  v_is_wish := lower(v_item_type) IN ('request', 'wish');

  -- (b) SMs + close every open conversation.
  FOR v_conv IN
    SELECT c.id
      FROM public.conversations c
      WHERE c.item_id = p_item_id AND c.closed_at IS NULL
  LOOP
    SELECT cp.user_id INTO v_other
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = v_conv.id AND cp.user_id <> v_owner
      LIMIT 1;

    IF v_other IS NOT NULL THEN
      IF v_is_wish THEN
        v_msg_other := 'Önskaren har tagit bort önskan "' || v_title || '". Konversationen är avslutad.';
        v_msg_owner := 'Du har tagit bort önskan. Hjälparen har informerats.';
      ELSE
        v_msg_other := 'Piffaren har tagit bort piffen "' || v_title || '". Konversationen är avslutad.';
        v_msg_owner := 'Du har tagit bort piffen. Mottagaren har informerats.';
      END IF;

      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conv.id, v_owner, v_msg_other, true, v_other);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conv.id, v_owner, v_msg_owner, true, v_owner);
    END IF;

    UPDATE public.conversations
      SET closed_at = now(), closed_reason = 'owner_deleted'
      WHERE id = v_conv.id AND closed_at IS NULL;
  END LOOP;

  -- (c) Whole-item fan-out to all non-not_selected interested users.
  -- Mirrors what archive_item's client caller does for archive.
  PERFORM public.notify_item_interest_event(
    p_item_id,
    CASE WHEN v_is_wish THEN 'wish_archived' ELSE 'pif_archived' END,
    NULL,
    false
  );

  -- (d) Finally, cascade delete.
  DELETE FROM items WHERE id = p_item_id AND user_id = auth.uid();
  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.delete_item_with_related_records(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_item_with_related_records(bigint, text) TO authenticated;


-- -------------------------------------------------------------
-- GAP 3: withdraw_receiver (pif branch) — add pif_reopened fan-out
--
-- Entire body preserved byte-for-byte from
-- db/manual_migrations/withdraw_receiver_wish_delete_on_self_withdraw.sql.
-- Only addition: single PERFORM after the owner notification, guarded
-- so it only fires on the pif branch. v_caller passed as
-- p_selected_user_id so the withdrawing receiver is excluded from the
-- broadcast (other pending candidates still receive it).
-- -------------------------------------------------------------
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

  IF v_is_wish THEN
    DELETE FROM public.interests
      WHERE item_id = p_item_id AND user_id = v_caller AND status = 'selected';
  ELSE
    UPDATE public.interests
      SET status = 'pending', selected_at = NULL
      WHERE item_id = p_item_id AND user_id = v_caller AND status = 'selected';
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

  -- NEW: pif_reopened fan-out to other candidates. Caller excluded via
  -- p_selected_user_id=v_caller. Wish branch skipped (wish stays active,
  -- other offers unaffected — matches withdraw_pif wish policy).
  IF NOT v_is_wish THEN
    PERFORM public.notify_item_interest_event(p_item_id, 'pif_reopened', v_caller, false);
  END IF;

  RETURN v_conversation;
END;
$function$;

REVOKE ALL ON FUNCTION public.withdraw_receiver(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_receiver(bigint, text) TO authenticated;
