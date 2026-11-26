-- Interests privacy, step 1 of 2 (Trello "Privacy: ratings, rating comments and
-- interest notes are readable by anyone", 2026-11-26).
--
-- interests had a table-level SELECT grant and a "Public read" policy, so
-- anyone (even signed out) could read every star rating, rating comment and
-- wish note through the REST API. Step 2 (20261127090100) limits SELECT to
-- the public columns. The app reads the private ones through these functions
-- instead, which only answer for the people concerned:
-- - get_interest_notes(): the note written when showing interest on a wish --
--   the post's owner sees all, a person sees their own;
-- - has_rated_handover(): has the rater already rated? (a pif's piffer: the
--   receiver's receiver_rating; a wish's helper: their own owner_rating);
-- - get_pending_ratings(): posts completed in the last N days that the caller
--   should rate and hasn't (RatingPrompt).
-- Additive and idempotent: applied (and the app deployed) before step 2.

CREATE OR REPLACE FUNCTION public.get_interest_notes(p_item_id bigint)
RETURNS TABLE (interest_id bigint, note text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.note
    FROM public.interests i
    JOIN public.items it ON it.id = i.item_id
   WHERE i.item_id = p_item_id
     AND i.note IS NOT NULL
     AND (it.user_id = (SELECT auth.uid()) OR i.user_id = (SELECT auth.uid()));
$$;
REVOKE ALL ON FUNCTION public.get_interest_notes(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_interest_notes(bigint) TO authenticated;

CREATE OR REPLACE FUNCTION public.has_rated_handover(p_item_id bigint, p_other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Pif: the piffer has rated this receiver.
    WHEN lower(coalesce(it.item_type, 'offer')) NOT IN ('request', 'wish') THEN
      it.user_id = (SELECT auth.uid()) AND EXISTS (
        SELECT 1 FROM public.interests i
         WHERE i.item_id = it.id AND i.user_id = p_other_user_id
           AND i.status = 'selected' AND i.receiver_rating IS NOT NULL)
    -- Wish: this helper has rated the wisher.
    ELSE EXISTS (
        SELECT 1 FROM public.interests i
         WHERE i.item_id = it.id AND i.user_id = (SELECT auth.uid())
           AND i.status = 'selected' AND i.owner_rating IS NOT NULL)
  END
  FROM public.items it
  WHERE it.id = p_item_id;
$$;
REVOKE ALL ON FUNCTION public.has_rated_handover(bigint, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_rated_handover(bigint, uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.get_pending_ratings(p_days integer DEFAULT 30)
RETURNS TABLE (item_id bigint, title text, is_wish boolean, ratee_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Wishes I helped with and haven't rated the wisher on.
  SELECT it.id, it.title, true, it.user_id
    FROM public.interests i
    JOIN public.items it ON it.id = i.item_id
   WHERE i.user_id = (SELECT auth.uid())
     AND i.status = 'selected'
     AND i.owner_rating IS NULL
     AND it.item_type = 'request'
     AND it.pif_status = 'completed'
     AND it.user_id <> (SELECT auth.uid())
     AND it.completed_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90)))
  UNION ALL
  -- My pifs whose receiver I haven't rated (not those given away outside the app).
  SELECT it.id, it.title, false, i.user_id
    FROM public.items it
    JOIN public.interests i ON i.item_id = it.id
   WHERE it.user_id = (SELECT auth.uid())
     AND coalesce(it.item_type, 'offer') = 'offer'
     AND it.pif_status = 'completed'
     AND NOT coalesce(it.completed_outside_app, false)
     AND i.status = 'selected'
     AND i.receiver_rating IS NULL
     AND i.user_id <> it.user_id
     AND it.completed_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90)));
$$;
REVOKE ALL ON FUNCTION public.get_pending_ratings(integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_pending_ratings(integer) TO authenticated;
