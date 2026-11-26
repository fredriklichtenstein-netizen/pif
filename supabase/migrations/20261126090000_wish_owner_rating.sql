-- Star ratings after a handover (decided by Fredrik 2026-11-26).
--
-- The one who gives rates the one who receives, never the other way round:
-- - pif: the piffer rates the receiver (interests.receiver_rating, as before);
-- - wish: the helper rates the wisher (new: interests.owner_rating, on the
--   helper's own interest row). Wishers no longer rate their helpers.
--
-- rate_after_handover() saves a rating once the post is done. Until now the
-- only star path was complete_pif_with_rating(), which refuses a post that is
-- already completed -- so after a normal handover (both sides confirmed) the
-- piffer's rating could not be saved. complete_pif_with_rating() stays for the
-- "Markera som klar ändå" path and for installed app builds.
--
-- get_user_public_stats(): the profile rating counts ratings received as a
-- receiver: receiver_rating on pifs + owner_rating on one's own wishes.
-- receiver_rating on wishes (helpers rated by wishers; 0 rows in production
-- on 2026-11-26) no longer counts.
--
-- Additive and idempotent. interests has no UPDATE policy, so the new columns
-- can only be written through rate_after_handover().

ALTER TABLE public.interests ADD COLUMN IF NOT EXISTS owner_rating smallint;
ALTER TABLE public.interests ADD COLUMN IF NOT EXISTS owner_rating_comment text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'interests_owner_rating_range') THEN
    ALTER TABLE public.interests
      ADD CONSTRAINT interests_owner_rating_range CHECK (owner_rating IS NULL OR owner_rating BETWEEN 1 AND 5);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.rate_after_handover(
  p_item_id bigint,
  p_rating smallint,
  p_comment text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_owner uuid;
  v_status text;
  v_is_wish boolean;
  v_helper_confirmed boolean;
  v_interest_id bigint;
  v_comment text := NULLIF(btrim(coalesce(p_comment, '')), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be 1-5' USING ERRCODE = '22023';
  END IF;

  SELECT user_id, coalesce(pif_status, 'active'),
         lower(coalesce(item_type, 'offer')) IN ('request', 'wish'),
         coalesce(receiver_confirmed_receipt, false)
    INTO v_owner, v_status, v_is_wish, v_helper_confirmed
    FROM public.items
   WHERE id = p_item_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_is_wish THEN
    -- Pif: the piffer rates the selected receiver, once the pif is completed.
    IF v_uid <> v_owner THEN
      RAISE EXCEPTION 'Only the piffer rates on a pif' USING ERRCODE = '42501';
    END IF;
    IF v_status <> 'completed' THEN
      RAISE EXCEPTION 'Pif is not completed yet' USING ERRCODE = '22023';
    END IF;
    SELECT i.id INTO v_interest_id
      FROM public.interests i
     WHERE i.item_id = p_item_id AND i.status = 'selected' AND i.user_id <> v_owner
     ORDER BY i.selected_at DESC NULLS LAST, i.created_at DESC
     LIMIT 1;
    IF v_interest_id IS NULL THEN
      RAISE EXCEPTION 'No receiver selected' USING ERRCODE = 'P0002';
    END IF;
    UPDATE public.interests
       SET receiver_rating = p_rating, rating_comment = v_comment
     WHERE id = v_interest_id;
    RETURN true;
  END IF;

  -- Wish: a selected helper rates the wisher, once the wish is done.
  IF v_uid = v_owner THEN
    RAISE EXCEPTION 'Wishers do not rate their helpers' USING ERRCODE = '42501';
  END IF;
  SELECT i.id INTO v_interest_id
    FROM public.interests i
   WHERE i.item_id = p_item_id AND i.user_id = v_uid AND i.status = 'selected'
   LIMIT 1;
  IF v_interest_id IS NULL THEN
    RAISE EXCEPTION 'Not a selected helper on this wish' USING ERRCODE = '42501';
  END IF;
  IF NOT (v_status = 'completed' OR v_helper_confirmed) THEN
    RAISE EXCEPTION 'Wish is not fulfilled yet' USING ERRCODE = '22023';
  END IF;
  UPDATE public.interests
     SET owner_rating = p_rating, owner_rating_comment = v_comment
   WHERE id = v_interest_id;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.rate_after_handover(bigint, smallint, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rate_after_handover(bigint, smallint, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_public_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH received AS (
    -- As a pif's receiver, rated by the piffer.
    SELECT i.receiver_rating::numeric AS v
      FROM public.interests i
      JOIN public.items it ON it.id = i.item_id
     WHERE i.user_id = p_user_id AND i.receiver_rating > 0
       AND coalesce(it.item_type, 'offer') <> 'request'
    UNION ALL
    -- As a wisher, rated by a helper.
    SELECT i.owner_rating::numeric
      FROM public.interests i
      JOIN public.items it ON it.id = i.item_id
     WHERE it.user_id = p_user_id AND it.item_type = 'request' AND i.owner_rating > 0
  )
  SELECT jsonb_build_object(
    'pifs_given', (
      SELECT count(*) FROM public.items
      WHERE user_id = p_user_id AND item_type = 'offer' AND pif_status = 'completed'
    ),
    'wishes_fulfilled', (
      SELECT count(DISTINCT it.id)
      FROM public.interests i
      JOIN public.items it ON it.id = i.item_id
      WHERE i.user_id = p_user_id AND i.status = 'selected'
        AND it.item_type = 'request' AND it.pif_status = 'completed'
    ),
    'active_posts', (
      SELECT count(*) FROM public.items WHERE user_id = p_user_id AND NOT is_inactive
    ),
    'total_posts', (
      SELECT count(*) FROM public.items WHERE user_id = p_user_id
    ),
    'rating_avg', (SELECT round(avg(v), 2) FROM received),
    'rating_count', (SELECT count(*) FROM received)
  );
$function$;
