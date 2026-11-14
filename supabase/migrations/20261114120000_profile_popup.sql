-- Profile popup (2026-11-14).
--
-- 1. profiles.bio: a short self-description, shown to signed-in users in
--    the profile popup. Column-level grants like the rest of profiles:
--    authenticated may read it and the owner may write it (row access is
--    the existing "Own update" policy); anon gets nothing.
-- 2. get_user_public_stats(): the popup's numbers in one call. Counts are
--    computed from items/interests -- profiles.completed_pifs and
--    reliability_score were never maintained (0 / one default for
--    everyone). The rating is the average of receiver_rating (the piffer
--    rates the receiver), which other users can't read from interests
--    directly. Returns counts and an average only: nothing that locates
--    anyone (see CLAUDE.md's address rule).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_bio_length') THEN
    ALTER TABLE public.profiles
      ADD CONSTRAINT profiles_bio_length CHECK (bio IS NULL OR char_length(bio) <= 300);
  END IF;
END
$$;

GRANT SELECT (bio), UPDATE (bio) ON public.profiles TO authenticated;

CREATE OR REPLACE FUNCTION public.get_user_public_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
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
    'rating_avg', (
      SELECT round(avg(receiver_rating)::numeric, 2) FROM public.interests
      WHERE user_id = p_user_id AND receiver_rating > 0
    ),
    'rating_count', (
      SELECT count(*) FROM public.interests
      WHERE user_id = p_user_id AND receiver_rating > 0
    )
  );
$$;

REVOKE ALL ON FUNCTION public.get_user_public_stats(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_public_stats(uuid) TO authenticated;
