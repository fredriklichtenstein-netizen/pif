-- Campaign attribution (2026-11-22): what people do in the app after clicking a
-- newsletter link. Newsletter links carry ?ref=nl-<issue>; the app keeps the tag
-- on the device for 30 days and, once the person is signed in, records a touch
-- via record_campaign_touch(). Triggers then record, once per person and
-- campaign: signup (account created after the click), first_post,
-- first_interest and first_save within 30 days of the latest touch.
--
-- Reported per campaign, never shown in the app: both tables have RLS on and no
-- policies, and clients can't read them. Additive only (safe for shipped app
-- builds) and idempotent. Every trigger swallows its own errors, so attribution
-- can never block a post, an interest or a save.

CREATE TABLE IF NOT EXISTS public.campaign_touches (
  id bigserial PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign text NOT NULL CHECK (campaign ~ '^nl-[a-z0-9-]{1,60}$'),
  touched_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS campaign_touches_user_time
  ON public.campaign_touches (user_id, touched_at DESC);

CREATE TABLE IF NOT EXISTS public.campaign_events (
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  campaign text NOT NULL,
  event text NOT NULL CHECK (event IN ('signup', 'first_post', 'first_interest', 'first_save')),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, campaign, event)
);
CREATE INDEX IF NOT EXISTS campaign_events_campaign ON public.campaign_events (campaign, event);

ALTER TABLE public.campaign_touches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_events ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.campaign_touches FROM anon, authenticated;
REVOKE ALL ON public.campaign_events FROM anon, authenticated;
REVOKE ALL ON SEQUENCE public.campaign_touches_id_seq FROM anon, authenticated;

-- Called by the app once the person is signed in. p_touched_at is when the link
-- was opened on the device; clamped to the last 30 days and never in the future.
-- Returns true when the touch was recorded, false when it wasn't (bad tag, or no
-- profile yet -- a new account is signed in before "Skapa profil" is done, and
-- the app keeps the tag and retries).
DROP FUNCTION IF EXISTS public.record_campaign_touch(text, timestamptz);
CREATE FUNCTION public.record_campaign_touch(p_campaign text, p_touched_at timestamptz)
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
  INSERT INTO public.campaign_touches (user_id, campaign, touched_at) VALUES (v_uid, p_campaign, v_at);
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

-- AFTER INSERT on items / interests / likes; TG_ARGV[0] is the event name.
CREATE OR REPLACE FUNCTION public._trg_campaign_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  BEGIN
    IF NEW.user_id IS NOT NULL THEN
      INSERT INTO public.campaign_events (user_id, campaign, event)
      SELECT NEW.user_id, t.campaign, TG_ARGV[0]
      FROM public.campaign_touches t
      WHERE t.user_id = NEW.user_id AND t.touched_at > now() - interval '30 days'
      ORDER BY t.touched_at DESC
      LIMIT 1
      ON CONFLICT DO NOTHING;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    RAISE WARNING '_trg_campaign_event: %', SQLERRM;
  END;
  RETURN NULL;
END;
$$;
REVOKE ALL ON FUNCTION public._trg_campaign_event() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_campaign_first_post ON public.items;
CREATE TRIGGER trg_campaign_first_post AFTER INSERT ON public.items
  FOR EACH ROW EXECUTE FUNCTION public._trg_campaign_event('first_post');
DROP TRIGGER IF EXISTS trg_campaign_first_interest ON public.interests;
CREATE TRIGGER trg_campaign_first_interest AFTER INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public._trg_campaign_event('first_interest');
DROP TRIGGER IF EXISTS trg_campaign_first_save ON public.likes;
CREATE TRIGGER trg_campaign_first_save AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public._trg_campaign_event('first_save');
