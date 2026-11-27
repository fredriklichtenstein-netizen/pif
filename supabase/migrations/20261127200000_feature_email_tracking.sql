-- Feature-update email tracking (Trello #135 follow-up, Fredrik's OK 2026-11-27).
--
-- 1. Campaign tags may now also be fa-<publish date>, put on every app link in a feature-update
--    email by send-notification-email, besides the newsletter's nl-<issue>. Same attribution
--    (campaign_touches / campaign_events, counts only): record_campaign_touch() and the
--    campaign_touches check accept both prefixes.
-- 2. _weekly_report_stats() adds: newsletter and feature-email clicks (people who came into the
--    app from the email), feature-email follow-up events, and how many have seen the latest
--    feature popup in the app (profiles.last_seen_announcement_at, already stored).
-- Same signatures. Idempotent.

ALTER TABLE public.campaign_touches DROP CONSTRAINT IF EXISTS campaign_touches_campaign_check;
ALTER TABLE public.campaign_touches
  ADD CONSTRAINT campaign_touches_campaign_check CHECK (campaign ~ '^(nl|fa)-[a-z0-9-]{1,60}$');

CREATE OR REPLACE FUNCTION public.record_campaign_touch(p_campaign text, p_touched_at timestamp with time zone)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_at timestamptz;
  v_created timestamptz;
BEGIN
  IF v_uid IS NULL OR p_campaign IS NULL OR p_campaign !~ '^(nl|fa)-[a-z0-9-]{1,60}$' THEN
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
$function$;

CREATE OR REPLACE FUNCTION public._weekly_report_stats(p_from timestamptz, p_to timestamptz)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    -- People
    'users_total',        (SELECT count(*) FROM profiles WHERE created_at < p_to),
    'users_new',          (SELECT count(*) FROM profiles WHERE created_at >= p_from AND created_at < p_to),
    'users_signed_in',    (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= p_from AND last_sign_in_at < p_to),
    'users_active',       (SELECT count(DISTINCT u) FROM (
                             SELECT user_id u FROM items     WHERE created_at >= p_from AND created_at < p_to
                             UNION ALL SELECT user_id FROM interests WHERE created_at >= p_from AND created_at < p_to
                             UNION ALL SELECT user_id FROM comments  WHERE created_at >= p_from AND created_at < p_to
                             UNION ALL SELECT user_id FROM likes     WHERE created_at >= p_from AND created_at < p_to
                             UNION ALL SELECT sender_id FROM messages WHERE created_at >= p_from AND created_at < p_to AND NOT coalesce(is_system_message, false)
                           ) a),
    'push_devices_total', (SELECT count(DISTINCT user_id) FROM push_devices WHERE created_at < p_to),
    -- Posts
    'pifs_new',           (SELECT count(*) FROM items WHERE coalesce(item_type, 'offer') = 'offer'  AND created_at >= p_from AND created_at < p_to),
    'wishes_new',         (SELECT count(*) FROM items WHERE item_type = 'request' AND created_at >= p_from AND created_at < p_to),
    'pifs_active',        (SELECT count(*) FROM items WHERE coalesce(item_type, 'offer') = 'offer'  AND coalesce(pif_status, 'active') = 'active' AND archived_at IS NULL AND created_at < p_to),
    'wishes_active',      (SELECT count(*) FROM items WHERE item_type = 'request' AND coalesce(pif_status, 'active') = 'active' AND archived_at IS NULL AND created_at < p_to),
    'pifs_completed',     (SELECT count(*) FROM items WHERE coalesce(item_type, 'offer') = 'offer'  AND pif_status = 'completed' AND completed_at >= p_from AND completed_at < p_to AND NOT coalesce(completed_outside_app, false)),
    'wishes_completed',   (SELECT count(*) FROM items WHERE item_type = 'request' AND pif_status = 'completed' AND completed_at >= p_from AND completed_at < p_to AND NOT coalesce(completed_outside_app, false)),
    'completed_outside',  (SELECT count(*) FROM items WHERE pif_status = 'completed' AND completed_at >= p_from AND completed_at < p_to AND coalesce(completed_outside_app, false)),
    'archived',           (SELECT count(*) FROM items WHERE archived_at >= p_from AND archived_at < p_to),
    -- Activity
    'interests_new',      (SELECT count(*) FROM interests WHERE created_at >= p_from AND created_at < p_to),
    'chosen',             (SELECT count(*) FROM interests WHERE selected_at >= p_from AND selected_at < p_to),
    'conversations_new',  (SELECT count(*) FROM conversations WHERE created_at >= p_from AND created_at < p_to),
    'messages_sent',      (SELECT count(*) FROM messages WHERE created_at >= p_from AND created_at < p_to AND NOT coalesce(is_system_message, false)),
    'comments_new',       (SELECT count(*) FROM comments WHERE created_at >= p_from AND created_at < p_to),
    'saves_new',          (SELECT count(*) FROM likes WHERE created_at >= p_from AND created_at < p_to),
    'follows_new',        (SELECT count(*) FROM follows WHERE created_at >= p_from AND created_at < p_to),
    -- Safety
    'reports_new',        (SELECT count(*) FROM reports WHERE created_at >= p_from AND created_at < p_to),
    'blocks_new',         (SELECT count(*) FROM user_blocks WHERE created_at >= p_from AND created_at < p_to),
    -- Newsletter (nl-) and feature-update email (fa-) campaigns: people who came into
    -- the app from the email (signed in), and what they did after (counts per event)
    'campaign_events',    (SELECT coalesce(jsonb_object_agg(event, n), '{}'::jsonb) FROM (
                             SELECT event, count(*) n FROM campaign_events
                              WHERE created_at >= p_from AND created_at < p_to AND campaign LIKE 'nl-%' GROUP BY event) c),
    'newsletter_clicks',  (SELECT count(DISTINCT user_id) FROM campaign_touches
                            WHERE touched_at >= p_from AND touched_at < p_to AND campaign LIKE 'nl-%'),
    'feature_events',     (SELECT coalesce(jsonb_object_agg(event, n), '{}'::jsonb) FROM (
                             SELECT event, count(*) n FROM campaign_events
                              WHERE created_at >= p_from AND created_at < p_to AND campaign LIKE 'fa-%' GROUP BY event) c),
    'feature_clicks',     (SELECT count(DISTINCT user_id) FROM campaign_touches
                            WHERE touched_at >= p_from AND touched_at < p_to AND campaign LIKE 'fa-%'),
    -- Feature updates in the app: the latest batch (as of the end of the period) and how
    -- many have seen its popup (last_seen_announcement_at at or after it)
    'announcement_latest', (SELECT to_char(max(published_at) AT TIME ZONE 'Europe/Stockholm', 'YYYY-MM-DD')
                              FROM feature_announcements WHERE published_at < p_to),
    'announcement_seen_total', (SELECT count(*) FROM profiles
                                  WHERE last_seen_announcement_at >= (SELECT max(published_at) FROM feature_announcements WHERE published_at < p_to)),
    'announcement_seen_new',   (SELECT count(*) FROM profiles
                                  WHERE last_seen_announcement_at >= (SELECT max(published_at) FROM feature_announcements WHERE published_at < p_to)
                                    AND last_seen_announcement_at >= p_from AND last_seen_announcement_at < p_to)
  );
$$;
