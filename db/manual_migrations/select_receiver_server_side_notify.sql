-- Apply manually on your Supabase project.
--
-- Moves the receiver_selected fan-out server-side into select_receiver
-- so it always fires and — critically — runs BEFORE the not_selected
-- UPDATE flips other interested users. If it ran after the flip,
-- notify_item_interest_event's loop filter
-- (`status is null or status <> 'not_selected'`) would skip them and
-- the "someone was selected" branch would be unreachable in production.
--
-- Only the NEW SELECTION path fires the notification. The early-return
-- reselection path (same receiver re-picked) stays silent per the
-- established convention — the system message from
-- _insert_pif_system_messages already covers that case.
--
-- Function body is preserved byte-for-byte from
-- db/manual_migrations/select_receiver_concurrency.sql; the only change
-- is a single PERFORM inserted after the interest-existence check and
-- BEFORE the `UPDATE ... SET status = 'not_selected'` block.

DROP FUNCTION IF EXISTS public.select_receiver(bigint, uuid);

CREATE OR REPLACE FUNCTION public.select_receiver(
  p_item_id bigint,
  p_receiver_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
  v_conversation_id uuid;
  v_interest_id bigint;
BEGIN
  -- Lock the item row so concurrent select_receiver calls serialize here.
  SELECT user_id INTO v_owner
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to select a receiver for this item'
      USING ERRCODE = '42501';
  END IF;

  -- Idempotency: if the same receiver is already selected, return existing convo.
  IF EXISTS (
    SELECT 1 FROM public.interests
    WHERE item_id = p_item_id
      AND status = 'selected'
      AND user_id = p_receiver_id
  ) THEN
    SELECT id INTO v_conversation_id
    FROM public.conversations
    WHERE item_id = p_item_id
      AND (participant_a = p_receiver_id OR participant_b = p_receiver_id)
    LIMIT 1;
    RETURN v_conversation_id;
  END IF;

  -- Reject if a different receiver already won.
  IF EXISTS (
    SELECT 1 FROM public.interests
    WHERE item_id = p_item_id AND status = 'selected'
  ) THEN
    RAISE EXCEPTION 'A receiver has already been selected for this item'
      USING ERRCODE = '23505';
  END IF;

  SELECT id INTO v_interest_id
  FROM public.interests
  WHERE item_id = p_item_id AND user_id = p_receiver_id
  LIMIT 1;

  IF v_interest_id IS NULL THEN
    RAISE EXCEPTION 'Receiver has not expressed interest in this item'
      USING ERRCODE = 'P0002';
  END IF;

  -- Fan-out notifications BEFORE flipping other interests to
  -- 'not_selected'. notify_item_interest_event's loop filter excludes
  -- 'not_selected' rows, so this MUST run first for other interested
  -- users to receive the "someone was selected" notification.
  -- SECURITY DEFINER + same auth.uid() context means the owner-gate
  -- inside notify_item_interest_event passes cleanly.
  PERFORM public.notify_item_interest_event(
    p_item_id, 'receiver_selected', p_receiver_id
  );

  -- Mark non-selected first to avoid tripping the partial unique index.
  UPDATE public.interests
     SET status = 'not_selected'
   WHERE item_id = p_item_id
     AND id <> v_interest_id
     AND status <> 'not_selected';

  UPDATE public.interests
     SET status = 'selected',
         selected_at = now()
   WHERE id = v_interest_id;

  -- Create or fetch the conversation between owner and receiver for this item.
  SELECT id INTO v_conversation_id
  FROM public.conversations
  WHERE item_id = p_item_id
    AND ((participant_a = v_owner AND participant_b = p_receiver_id)
      OR (participant_a = p_receiver_id AND participant_b = v_owner))
  LIMIT 1;

  IF v_conversation_id IS NULL THEN
    INSERT INTO public.conversations (item_id, participant_a, participant_b)
    VALUES (p_item_id, v_owner, p_receiver_id)
    RETURNING id INTO v_conversation_id;
  END IF;

  RETURN v_conversation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.select_receiver(bigint, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.select_receiver(bigint, uuid) TO authenticated;
