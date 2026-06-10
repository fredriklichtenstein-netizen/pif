-- Apply manually on your Supabase project.
--
-- Fixes: complete_pif_with_rating raising P0002 'No selected receiver found'
-- on the one-sided hard-complete path ("Markera som klar ändå").
--
-- Root cause: the previous body looked up the receiver via
--   SELECT id FROM interests WHERE item_id = p_item_id AND status = 'selected'
-- but by the time the piffer hits the rating modal, confirm_pif_handoff
-- (and/or the "Mark as piffed" path which sets items.pif_status='piffed')
-- has already transitioned the chosen interest's status away from
-- 'selected'. The lookup therefore returned no rows.
--
-- Fix: resolve the receiver from public.conversations (durable source of
-- truth — its participants are pinned at selection time and never move),
-- with a defensive fallback to any non-piffer interest row for the item
-- (ordered so a still-'selected' row wins if present).

CREATE OR REPLACE FUNCTION public.complete_pif_with_rating(
  p_item_id  bigint,
  p_rating   int,
  p_comment  text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_piffer   uuid;
  v_receiver uuid;
BEGIN
  -- Lock the item row + verify ownership.
  SELECT user_id INTO v_piffer
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_piffer IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_piffer <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to complete this pif'
      USING ERRCODE = '42501';
  END IF;

  -- Primary lookup: the receiver is the other participant of the pif's
  -- conversation. This is stable across status transitions.
  SELECT CASE
           WHEN participant_a = v_piffer THEN participant_b
           ELSE participant_a
         END
    INTO v_receiver
  FROM public.conversations
  WHERE item_id = p_item_id
  ORDER BY created_at ASC
  LIMIT 1;

  -- Fallback: any interest row for this item that isn't the piffer.
  -- Ordered so a still-'selected' row wins if present, then most-recently
  -- selected_at, then most-recently created.
  IF v_receiver IS NULL THEN
    SELECT user_id INTO v_receiver
    FROM public.interests
    WHERE item_id = p_item_id
      AND user_id <> v_piffer
    ORDER BY (status = 'selected') DESC,
             selected_at DESC NULLS LAST,
             created_at DESC
    LIMIT 1;
  END IF;

  IF v_receiver IS NULL THEN
    RAISE EXCEPTION 'No selected receiver found' USING ERRCODE = 'P0002';
  END IF;

  -- Persist rating (private; one row per (item, rater, ratee)).
  INSERT INTO public.ratings (item_id, rater_id, ratee_id, rating, comment, created_at)
  VALUES (p_item_id, v_piffer, v_receiver, p_rating, NULLIF(btrim(p_comment), ''), now())
  ON CONFLICT (item_id, rater_id, ratee_id) DO UPDATE
    SET rating     = EXCLUDED.rating,
        comment    = EXCLUDED.comment,
        created_at = now();

  -- Mark the pif complete and pin both confirmation flags so any UI that
  -- still reads them shows the terminal state.
  UPDATE public.items
     SET pif_status                 = 'completed',
         piffer_confirmed_handoff   = true,
         receiver_confirmed_receipt = true,
         completed_at               = now()
   WHERE id = p_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public.complete_pif_with_rating(bigint, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.complete_pif_with_rating(bigint, int, text) TO authenticated;
