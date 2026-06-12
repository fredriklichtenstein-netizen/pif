-- Manual migration — apply via Supabase SQL editor.
-- Ensures unarchiving (restore_item) republishes the pif as active and
-- does NOT restore any prior selection. Interests are intentionally left
-- as they currently are; this RPC only touches the item row.

CREATE OR REPLACE FUNCTION public.restore_item(p_item_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.items WHERE id = p_item_id FOR UPDATE;
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_owner <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;

  UPDATE public.items
    SET pif_status = 'active',
        archived_at = NULL,
        archived_reason = NULL,
        piffer_confirmed_handoff = false,
        receiver_confirmed_receipt = false
    WHERE id = p_item_id;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.restore_item(bigint) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.restore_item(bigint) TO authenticated;
