-- 2026-11-22: record_campaign_touch ignores the same tag sent again within a minute
-- (two calls in flight on sign-in wrote two identical touch rows; app builds
-- without the client-side guard keep working). Same signature: CREATE OR REPLACE.

CREATE OR REPLACE FUNCTION public.record_campaign_touch(p_campaign text, p_touched_at timestamptz)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_at timestamptz;
  v_created timestamptz;
BEGIN
  IF v_uid IS NULL OR p_campaign IS NULL OR p_campaign !~ '^nl-[a-z0-9-]{1,60}$' THEN
    RETURN false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = v_uid) THEN
    RETURN false;
  END IF;
  v_at := GREATEST(LEAST(COALESCE(p_touched_at, now()), now()), now() - interval '30 days');
  -- The same tag sent twice within a minute (two calls in flight, or an app
  -- build without the client-side guard) is one touch. The lock serialises
  -- parallel calls for the same person + tag, so the check sees the other's row.
  PERFORM pg_advisory_xact_lock(hashtextextended(v_uid::text || ':' || p_campaign, 0));
  IF NOT EXISTS (
    SELECT 1 FROM public.campaign_touches
    WHERE user_id = v_uid AND campaign = p_campaign AND created_at > now() - interval '1 minute'
  ) THEN
    INSERT INTO public.campaign_touches (user_id, campaign, touched_at) VALUES (v_uid, p_campaign, v_at);
  END IF;
  SELECT created_at INTO v_created FROM auth.users WHERE id = v_uid;
  -- A few minutes of slack: the device clock and the server clock can disagree.
  IF v_created IS NOT NULL AND v_created >= v_at - interval '5 minutes' THEN
    INSERT INTO public.campaign_events (user_id, campaign, event)
    VALUES (v_uid, p_campaign, 'signup')
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.record_campaign_touch(text, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_campaign_touch(text, timestamptz) TO authenticated;
