-- Manual migration — apply via Supabase SQL editor.
-- Updates withdraw_pif so the previously selected receiver's interest row
-- is DELETED rather than reset to 'pending'. This prevents the receiver
-- from reappearing in the interested-users list after the piffer withdraws
-- (reopen OR archive).

CREATE OR REPLACE FUNCTION public.withdraw_pif(
  p_item_id bigint,
  p_action  text -- 'reopen' | 'archive'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  IF p_action NOT IN ('reopen', 'archive') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action USING ERRCODE = '22023';
  END IF;

  SELECT user_id INTO v_owner
    FROM public.items
    WHERE id = p_item_id
    FOR UPDATE;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  -- Remove the selected receiver entirely so they do not reappear in
  -- the interested-users list. Other 'not_selected' interests are reset
  -- to 'pending' so those users can be reconsidered.
  DELETE FROM public.interests
    WHERE item_id = p_item_id
      AND status = 'selected';

  UPDATE public.interests
    SET status = 'pending', selected_at = NULL
    WHERE item_id = p_item_id
      AND status = 'not_selected';

  IF p_action = 'reopen' THEN
    UPDATE public.items
      SET pif_status = 'active',
          piffer_confirmed_handoff = false,
          receiver_confirmed_receipt = false,
          archived_at = NULL,
          archived_reason = NULL
      WHERE id = p_item_id;
  ELSE
    UPDATE public.items
      SET pif_status = 'archived',
          piffer_confirmed_handoff = false,
          receiver_confirmed_receipt = false,
          archived_at = now(),
          archived_reason = 'Piffer withdrew'
      WHERE id = p_item_id;
  END IF;

  -- Close any conversation tied to this item so neither party can keep
  -- messaging after the withdrawal.
  UPDATE public.conversations
    SET closed_at = now()
    WHERE item_id = p_item_id
      AND closed_at IS NULL;
END;
$$;

REVOKE ALL ON FUNCTION public.withdraw_pif(bigint, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.withdraw_pif(bigint, text) TO authenticated;
