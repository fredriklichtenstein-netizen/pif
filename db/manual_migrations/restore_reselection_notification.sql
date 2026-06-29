-- =============================================================
-- Restore reselection-only notification to chosen wish fulfiller.
-- First-time selection remains silent (system message in the
-- newly-opened conversation is sufficient, per signal convention:
-- notifications only when an action closes/archives a conversation).
-- Reselection qualifies because it reopens a previously-closed one.
--
-- Pif reselection NOT covered: select_receiver doesn't clear
-- closed_at, insert system messages, or return was_reselection.
-- A notification would point at a stale invisible conversation.
-- Logged separately in plan.md.
-- =============================================================

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
      -- Chosen user: silent on first-time selection (covered by system
      -- message in newly-opened conversation); notified on reselection
      -- because the prior conversation was closed and could be missed.
      IF p_selected_user_id IS NOT NULL AND v_rec.user_id = p_selected_user_id THEN
        IF p_is_reselection THEN
          v_msg_title := 'Önskaren har valt dig på nytt för "' || v_title || '".';
          v_msg_content := 'Konversationen är öppen igen — ni kan fortsätta där ni slutade.';
        ELSE
          CONTINUE;
        END IF;
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

    ELSIF p_event = 'interest_withdrawn' THEN
      IF p_selected_user_id IS NULL OR v_rec.user_id <> p_selected_user_id THEN CONTINUE;
      ELSE
        v_msg_title := 'Piffaren har avmarkerat dig som mottagare för "' || v_title || '".';
        v_msg_content := 'Piffen är öppen igen — du kan visa intresse på nytt om du vill.';
      END IF;

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
