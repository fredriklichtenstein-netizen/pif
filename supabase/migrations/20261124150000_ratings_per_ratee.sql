-- Ratings per rated person, and wish helpers rated by name (2026-11-24, from
-- the staging test of Trello #132).
--
-- Before: UNIQUE (item_id, rater_id) = one rating per person per post, and
-- submit_rating() rated "the first selected interest". A wish can have several
-- helpers, so the wisher could rate at most one of them, and not necessarily
-- the one they meant. It also refused until the post was completed, while the
-- app opens the helper rating right after "Markera som uppfylld" (the wish is
-- still waiting for the helper's confirmation then) -> "Item not in a
-- rateable state". Production had 0 rows in ratings when this was written.
--
-- After:
-- - unique per (item_id, rater_id, ratee_id);
-- - submit_rating() keeps its signature (installed app builds call it) and
--   resolves the ratee as before, with the new conflict target;
-- - submit_rating_for(p_item_id, p_ratee, ...) rates a named person: the
--   owner rates one of the selected people, a selected person rates the owner;
-- - a wish's owner may rate a selected helper once they have confirmed the
--   wish as granted (piffer_confirmed_handoff), not only after completion.
-- Additive and idempotent.

CREATE UNIQUE INDEX IF NOT EXISTS ratings_item_rater_ratee_key
  ON public.ratings (item_id, rater_id, ratee_id);
ALTER TABLE public.ratings DROP CONSTRAINT IF EXISTS ratings_item_id_rater_id_key;

CREATE OR REPLACE FUNCTION public.submit_rating(p_item_id bigint, p_outcome rating_outcome, p_note text DEFAULT NULL::text)
 RETURNS ratings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rater uuid := auth.uid();
  v_ratee uuid;
  v_owner uuid;
  v_status text;
  v_dummy int;
  v_row public.ratings;
BEGIN
  IF v_rater IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT user_id, pif_status
    INTO v_owner, v_status
    FROM public.items
   WHERE id = p_item_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found';
  END IF;

  IF v_status NOT IN ('piffed', 'completed', 'archived') THEN
    RAISE EXCEPTION 'Item not in a rateable state';
  END IF;

  IF v_rater = v_owner THEN
    -- Piffer rates the selected receiver
    SELECT user_id INTO v_ratee
      FROM public.interests
     WHERE item_id = p_item_id AND status = 'selected'
     LIMIT 1;
    IF v_ratee IS NULL THEN
      RAISE EXCEPTION 'No selected receiver to rate';
    END IF;
  ELSE
    -- Receiver leaves feedback for the piffer
    SELECT 1 INTO v_dummy
      FROM public.interests
     WHERE item_id = p_item_id AND user_id = v_rater AND status = 'selected'
     LIMIT 1;
    IF NOT FOUND THEN
      RAISE EXCEPTION 'Not a participant on this item';
    END IF;
    v_ratee := v_owner;
  END IF;

  INSERT INTO public.ratings (item_id, rater_id, ratee_id, outcome, private_note)
       VALUES (p_item_id, v_rater, v_ratee, p_outcome,
               CASE WHEN p_note IS NULL OR length(trim(p_note)) = 0 THEN NULL ELSE p_note END)
  ON CONFLICT (item_id, rater_id, ratee_id) DO UPDATE
    SET outcome = EXCLUDED.outcome,
        private_note = EXCLUDED.private_note,
        created_at = now()
  RETURNING * INTO v_row;

  PERFORM public.recompute_reliability(v_ratee);

  RETURN v_row;
END;
$function$;

CREATE OR REPLACE FUNCTION public.submit_rating_for(
  p_item_id bigint,
  p_ratee uuid,
  p_outcome rating_outcome,
  p_note text DEFAULT NULL::text
)
 RETURNS ratings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rater uuid := auth.uid();
  v_owner uuid;
  v_status text;
  v_is_wish boolean;
  v_owner_confirmed boolean;
  v_row public.ratings;
BEGIN
  IF v_rater IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_ratee IS NULL OR p_ratee = v_rater THEN
    RAISE EXCEPTION 'Invalid ratee' USING ERRCODE = '22023';
  END IF;

  SELECT user_id, coalesce(pif_status, 'active'),
         lower(coalesce(item_type, 'offer')) IN ('request', 'wish'),
         coalesce(piffer_confirmed_handoff, false)
    INTO v_owner, v_status, v_is_wish, v_owner_confirmed
    FROM public.items
   WHERE id = p_item_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  IF v_rater = v_owner THEN
    -- Owner rates one of the selected people (a pif's receiver, a wish's helper).
    IF NOT EXISTS (
      SELECT 1 FROM public.interests
       WHERE item_id = p_item_id AND user_id = p_ratee AND status = 'selected'
    ) THEN
      RAISE EXCEPTION 'Not a selected participant on this item' USING ERRCODE = '42501';
    END IF;
    IF NOT (v_status IN ('piffed', 'completed', 'archived') OR (v_is_wish AND v_owner_confirmed)) THEN
      RAISE EXCEPTION 'Item not in a rateable state' USING ERRCODE = 'P0001';
    END IF;
  ELSE
    -- A selected person rates the owner.
    IF p_ratee <> v_owner OR NOT EXISTS (
      SELECT 1 FROM public.interests
       WHERE item_id = p_item_id AND user_id = v_rater AND status = 'selected'
    ) THEN
      RAISE EXCEPTION 'Not a participant on this item' USING ERRCODE = '42501';
    END IF;
    IF v_status NOT IN ('piffed', 'completed', 'archived') THEN
      RAISE EXCEPTION 'Item not in a rateable state' USING ERRCODE = 'P0001';
    END IF;
  END IF;

  INSERT INTO public.ratings (item_id, rater_id, ratee_id, outcome, private_note)
       VALUES (p_item_id, v_rater, p_ratee, p_outcome,
               CASE WHEN p_note IS NULL OR length(trim(p_note)) = 0 THEN NULL ELSE p_note END)
  ON CONFLICT (item_id, rater_id, ratee_id) DO UPDATE
    SET outcome = EXCLUDED.outcome,
        private_note = EXCLUDED.private_note,
        created_at = now()
  RETURNING * INTO v_row;

  PERFORM public.recompute_reliability(p_ratee);

  RETURN v_row;
END;
$function$;

REVOKE ALL ON FUNCTION public.submit_rating_for(bigint, uuid, rating_outcome, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_rating_for(bigint, uuid, rating_outcome, text) TO authenticated;
