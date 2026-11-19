-- Native push notifications (Trello G3.5). Idempotent: safe to replay on a
-- fresh branch. Nothing here sends anything until a device has registered,
-- vault secret 'push_function_url' exists and the send-push function has its
-- APNs key; until then every path returns early.

-- One row per phone. The token is the APNs (or later FCM) device token.
CREATE TABLE IF NOT EXISTS public.push_devices (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text NOT NULL CHECK (platform IN ('ios', 'android')),
  environment text NOT NULL DEFAULT 'production' CHECK (environment IN ('sandbox', 'production')),
  app_version text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS push_devices_user_id_idx ON public.push_devices (user_id);

ALTER TABLE public.push_devices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "push_devices_select_own" ON public.push_devices;
CREATE POLICY "push_devices_select_own" ON public.push_devices
  FOR SELECT TO authenticated USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "push_devices_delete_own" ON public.push_devices;
CREATE POLICY "push_devices_delete_own" ON public.push_devices
  FOR DELETE TO authenticated USING (user_id = (SELECT auth.uid()));
REVOKE ALL ON public.push_devices FROM anon, authenticated;
GRANT SELECT, DELETE ON public.push_devices TO authenticated;

-- Writes go through these two functions only. A token that moves to another
-- account on the same phone (sign out, sign in as someone else) follows the
-- account that registered it last.
DROP FUNCTION IF EXISTS public.register_push_device(text, text, text, text);
CREATE FUNCTION public.register_push_device(
  p_token text,
  p_platform text,
  p_environment text DEFAULT 'production',
  p_app_version text DEFAULT NULL
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;
  IF p_platform NOT IN ('ios', 'android')
     OR coalesce(p_environment, 'production') NOT IN ('sandbox', 'production')
     OR coalesce(length(p_token), 0) NOT BETWEEN 16 AND 4096 THEN
    RAISE EXCEPTION 'invalid push device';
  END IF;
  INSERT INTO public.push_devices (user_id, token, platform, environment, app_version)
  VALUES (v_uid, p_token, p_platform, coalesce(p_environment, 'production'), left(p_app_version, 32))
  ON CONFLICT (token) DO UPDATE
    SET user_id = excluded.user_id,
        platform = excluded.platform,
        app_version = excluded.app_version,
        last_seen_at = now();
END;
$function$;

DROP FUNCTION IF EXISTS public.unregister_push_device(text);
CREATE FUNCTION public.unregister_push_device(p_token text) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  DELETE FROM public.push_devices WHERE token = p_token AND user_id = (SELECT auth.uid());
$function$;

REVOKE ALL ON FUNCTION public.register_push_device(text, text, text, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unregister_push_device(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_push_device(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unregister_push_device(text) TO authenticated;

-- Sends one push to one user's phones via the send-push edge function.
-- Respects the user's push preference; never raises (a failed push must not
-- roll back the comment, message or notification that caused it).
CREATE OR REPLACE FUNCTION public._trigger_push(
  p_user_id uuid, p_pref_key text, p_title text, p_body text, p_url text
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_prefs jsonb;
  v_url text;
  v_secret text;
BEGIN
  IF p_user_id IS NULL OR p_body IS NULL THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.push_devices WHERE user_id = p_user_id) THEN
    RETURN;
  END IF;
  IF p_pref_key IS NOT NULL THEN
    SELECT notification_preferences INTO v_prefs FROM public.profiles WHERE id = p_user_id;
    IF v_prefs IS NOT NULL AND (v_prefs ->> p_pref_key) = 'false' THEN
      RETURN;
    END IF;
  END IF;

  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'push_function_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN;
  END IF;

  PERFORM net.http_post(
    url => v_url,
    headers => jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
    body => jsonb_build_object(
      'userId', p_user_id,
      'title', p_title,
      'body', left(p_body, 240),
      'url', coalesce(p_url, '/')
    )
  );
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING '_trigger_push failed for %: %', p_user_id, SQLERRM;
END;
$function$;
REVOKE ALL ON FUNCTION public._trigger_push(uuid, text, text, text, text) FROM PUBLIC, anon, authenticated;

-- Every in-app notification also goes out as a push, with the same text.
CREATE OR REPLACE FUNCTION public._push_for_notification() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_pref text;
  v_body text;
  v_url text;
BEGIN
  v_pref := CASE new.type
    WHEN 'comment_reply' THEN 'push_mentions'
    WHEN 'thread_comment' THEN 'push_mentions'
    WHEN 'scheduled_item_published' THEN 'push_scheduled_published'
    WHEN 'conversation_reopen_requested' THEN 'push_messages'
    WHEN 'conversation_reopen_responded' THEN 'push_messages'
    ELSE 'push_item_updates'
  END;
  v_body := coalesce(
    new.payload ->> 'title',
    CASE WHEN new.type = 'interest_received' THEN
      coalesce(new.payload ->> 'actor_name', 'Någon') || ' visade intresse för "'
        || coalesce(new.payload ->> 'item_title', 'din piff') || '".'
    END
  );
  v_url := coalesce(
    new.payload ->> 'action_url',
    CASE WHEN new.payload ? 'item_id' THEN '/item/' || (new.payload ->> 'item_id') END,
    '/'
  );
  PERFORM public._trigger_push(new.user_id, v_pref, NULL, v_body, v_url);
  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS trg_push_for_notification ON public.notifications;
CREATE TRIGGER trg_push_for_notification
  AFTER INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public._push_for_notification();

-- New chat messages: push to the other participants (a conversation has two).
CREATE OR REPLACE FUNCTION public._push_for_message() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_sender text;
  v_rec record;
BEGIN
  IF coalesce(new.is_system_message, false) OR new.deleted_at IS NOT NULL OR new.sender_id IS NULL THEN
    RETURN new;
  END IF;
  SELECT coalesce(
           nullif(trim(concat_ws(' ', nullif(trim(first_name), ''), nullif(trim(last_name), ''))), ''),
           nullif(trim(username), ''),
           'PIF')
    INTO v_sender
    FROM public.profiles WHERE id = new.sender_id;
  FOR v_rec IN
    SELECT user_id FROM public.conversation_participants
    WHERE conversation_id = new.conversation_id AND user_id <> new.sender_id
  LOOP
    PERFORM public._trigger_push(
      v_rec.user_id, 'push_messages', coalesce(v_sender, 'PIF'),
      left(new.content, 140), '/messages?conversation=' || new.conversation_id
    );
  END LOOP;
  RETURN new;
END;
$function$;

DROP TRIGGER IF EXISTS trg_push_for_message ON public.messages;
CREATE TRIGGER trg_push_for_message
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._push_for_message();
