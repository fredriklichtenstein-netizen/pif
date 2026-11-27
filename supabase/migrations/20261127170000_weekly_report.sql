-- Weekly key figures email (Trello #135, 2026-11-27).
--
-- _weekly_report_stats(from, to) counts what happened in PIF in a period. Counts only: no
-- names, emails, addresses or any other personal data, so the email can go to the people on
-- the card (one is outside the organisation). Called by the edge function weekly-report with
-- the service role; no client grants.
--
-- _send_weekly_report() is what pg_cron runs (Monday morning): one pg_net call to the edge
-- function with the shared x-internal-secret, like the other server-to-function jobs. The
-- function computes this week and the week before and sends the email.
-- Additive and idempotent.

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
    -- Newsletter campaigns (counts per event)
    'campaign_events',    (SELECT coalesce(jsonb_object_agg(event, n), '{}'::jsonb) FROM (
                             SELECT event, count(*) n FROM campaign_events WHERE created_at >= p_from AND created_at < p_to GROUP BY event) c)
  );
$$;
REVOKE ALL ON FUNCTION public._weekly_report_stats(timestamptz, timestamptz) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._send_weekly_report()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'notification_email_function_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RAISE WARNING 'weekly report: vault secrets missing, not sent';
    RETURN;
  END IF;
  PERFORM net.http_post(
    url => replace(v_url, 'send-notification-email', 'weekly-report'),
    headers => jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
    body => '{}'::jsonb,
    timeout_milliseconds => 30000
  );
END;
$$;
REVOKE ALL ON FUNCTION public._send_weekly_report() FROM PUBLIC, anon, authenticated;

-- Mondays 06:41 UTC (07:41 Swedish winter time, 08:41 summer time).
DO $$
BEGIN
  PERFORM cron.unschedule('send-weekly-report') WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'send-weekly-report');
  PERFORM cron.schedule('send-weekly-report', '41 6 * * 1', 'SELECT public._send_weekly_report();');
END $$;
