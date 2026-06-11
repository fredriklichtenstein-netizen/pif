-- Allows piffer / receiver to undo their own handoff confirmation as long as
-- pif_status has not yet flipped to 'completed'.
--
-- Rules enforced server-side:
--   * piffer undo: allowed any time before 'completed'. If receiver had
--     already confirmed, both flags are cleared.
--   * receiver undo: only allowed when the piffer has NOT yet confirmed.
--
-- Run manually in the SQL editor.

CREATE OR REPLACE FUNCTION public.undo_pif_handoff_confirmation(
  p_item_id integer,
  p_role text
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_item record;
  v_receiver_was_confirmed boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  SELECT id, user_id, pif_status, piffer_confirmed_handoff, receiver_confirmed_receipt
  INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF v_item.pif_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot undo: pif already completed';
  END IF;

  IF p_role = 'piffer' THEN
    IF v_item.user_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    v_receiver_was_confirmed := v_item.receiver_confirmed_receipt;
    UPDATE public.items
    SET piffer_confirmed_handoff = false,
        receiver_confirmed_receipt = false
    WHERE id = p_item_id;
    RETURN json_build_object(
      'ok', true,
      'role', 'piffer',
      'receiver_was_confirmed', v_receiver_was_confirmed
    );

  ELSIF p_role = 'receiver' THEN
    IF v_item.piffer_confirmed_handoff THEN
      RAISE EXCEPTION 'Cannot undo: piffer already confirmed';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.interests
      WHERE item_id = p_item_id AND user_id = v_uid AND status = 'selected'
    ) THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    UPDATE public.items
    SET receiver_confirmed_receipt = false
    WHERE id = p_item_id;
    RETURN json_build_object('ok', true, 'role', 'receiver');

  ELSE
    RAISE EXCEPTION 'Invalid role';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.undo_pif_handoff_confirmation(integer, text) TO authenticated;
