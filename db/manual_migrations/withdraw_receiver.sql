-- Manual migration — apply via Supabase SQL editor.
-- Lets the SELECTED receiver back out of a pif before completion.
-- The pif is republished as 'active' (visible to everyone again),
-- but THIS conversation is closed forever via conversations.closed_at.
-- An optional free-text comment is surfaced to the piffer as a system
-- message and persisted on the notification row for later reference.

CREATE OR REPLACE FUNCTION public.withdraw_receiver(
  p_item_id bigint,
  p_comment text DEFAULT NULL
)
RETURNS uuid -- the conversation_id that was closed (for client-side UX)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller        uuid := auth.uid();
  v_owner         uuid;
  v_pif_status    text;
  v_conversation  uuid;
  v_clean_comment text := nullif(btrim(coalesce(p_comment, '')), '');
  v_msg_piffer    text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  -- Lock the item row to serialize concurrent state mutations.
  SELECT user_id, pif_status INTO v_owner, v_pif_status
    FROM public.items
    WHERE id = p_item_id
    FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner = v_caller THEN
    RAISE EXCEPTION 'Piffer should use withdraw_pif' USING ERRCODE = '22023';
  END IF;

  IF v_pif_status IN ('completed', 'archived') THEN
    RAISE EXCEPTION 'Pif is no longer active' USING ERRCODE = '22023';
  END IF;

  -- Caller must currently be the selected receiver.
  IF NOT EXISTS (
    SELECT 1 FROM public.interests
      WHERE item_id = p_item_id
        AND user_id = v_caller
        AND status = 'selected'
  ) THEN
    RAISE EXCEPTION 'Not the selected receiver' USING ERRCODE = '42501';
  END IF;

  -- Reset the receiver's interest from 'selected' back to 'pending'
  -- so they could re-engage on a different pif later; for THIS pif the
  -- conversation closure prevents any further messaging.
  UPDATE public.interests
    SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id
      AND user_id = v_caller
      AND status = 'selected';

  -- Republish the pif as active and clear handoff flags.
  UPDATE public.items
    SET pif_status = 'active',
        piffer_confirmed_handoff = false,
        receiver_confirmed_receipt = false,
        archived_at = NULL,
        archived_reason = NULL
    WHERE id = p_item_id;

  -- Find + close the 1:1 conversation between piffer and receiver for this item.
  SELECT id INTO v_conversation
    FROM public.conversations
    WHERE item_id = p_item_id
      AND ((participant_a = v_owner  AND participant_b = v_caller)
        OR (participant_a = v_caller AND participant_b = v_owner))
    LIMIT 1;

  IF v_conversation IS NOT NULL THEN
    UPDATE public.conversations
      SET closed_at = now()
      WHERE id = v_conversation
        AND closed_at IS NULL;

    -- Targeted system messages (filtered client-side via target_user_id).
    v_msg_piffer :=
      'Mottagaren har ångrat sig och kan/vill inte längre ta emot piffen. '
      || 'Piffen är nu öppen för andra att visa intresse igen.';
    IF v_clean_comment IS NOT NULL THEN
      v_msg_piffer := v_msg_piffer || E'\n\nMottagarens meddelande: ' || v_clean_comment;
    END IF;

    INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      VALUES (v_conversation, v_caller, v_msg_piffer, true, v_owner);

    INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
      VALUES (
        v_conversation,
        v_caller,
        'Du har ångrat mottagningen. Piffaren har informerats.',
        true,
        v_caller
      );
  END IF;

  -- Notify the piffer. The notifications table is assumed to have at
  -- least (user_id, type, payload jsonb, created_at); adjust column
  -- names here if your schema differs.
  BEGIN
    INSERT INTO public.notifications (user_id, type, payload)
      VALUES (
        v_owner,
        'receiver_withdrew',
        jsonb_build_object(
          'item_id', p_item_id,
          'receiver_id', v_caller,
          'conversation_id', v_conversation,
          'comment', v_clean_comment
        )
      );
  EXCEPTION WHEN undefined_table OR undefined_column THEN
    -- notifications table/columns are optional — silently skip.
    NULL;
  END;

  RETURN v_conversation;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_receiver(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_receiver(bigint, text) TO authenticated;
