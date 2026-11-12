-- Newsletter: keep app users in step with the newsletter's contact
-- list in Resend (edge function newsletter-sync). Opt-out: everyone with a
-- confirmed address is on it unless notification_preferences.email_newsletter
-- is false. The triggers only enqueue a pg_net call; any error is swallowed
-- with a warning so sign-up, email change and account deletion can never
-- fail because of the newsletter. Needs vault secret
-- 'newsletter_sync_function_url' (absent = sync off).

CREATE OR REPLACE FUNCTION public._newsletter_sync_enqueue(p_body jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_url text;
  v_secret text;
BEGIN
  SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'newsletter_sync_function_url';
  SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
  IF v_url IS NULL OR v_secret IS NULL THEN
    RETURN;
  END IF;
  PERFORM net.http_post(
    url => v_url,
    headers => jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
    body => p_body
  );
EXCEPTION WHEN others THEN
  RAISE WARNING '[newsletter] enqueue failed: %', SQLERRM;
END;
$$;

REVOKE ALL ON FUNCTION public._newsletter_sync_enqueue(jsonb) FROM PUBLIC, anon, authenticated;

-- Profile changes that matter to the list: name, language, the switch.
CREATE OR REPLACE FUNCTION public._newsletter_on_profile_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'INSERT'
     OR NEW.first_name IS DISTINCT FROM OLD.first_name
     OR NEW.last_name IS DISTINCT FROM OLD.last_name
     OR NEW.language IS DISTINCT FROM OLD.language
     OR (NEW.notification_preferences -> 'email_newsletter')
        IS DISTINCT FROM (OLD.notification_preferences -> 'email_newsletter') THEN
    PERFORM public._newsletter_sync_enqueue(jsonb_build_object('type', 'upsert_user', 'userId', NEW.id));
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING '[newsletter] profile trigger failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_newsletter_profile ON public.profiles;
CREATE TRIGGER trg_newsletter_profile
  AFTER INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public._newsletter_on_profile_change();

-- Address confirmed (first time) or changed, and account deleted.
CREATE OR REPLACE FUNCTION public._newsletter_on_auth_user_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    IF OLD.email IS NOT NULL AND OLD.email <> '' THEN
      PERFORM public._newsletter_sync_enqueue(jsonb_build_object('type', 'delete_email', 'email', OLD.email));
    END IF;
    RETURN OLD;
  END IF;

  IF NEW.email IS DISTINCT FROM OLD.email AND coalesce(OLD.email, '') <> '' THEN
    PERFORM public._newsletter_sync_enqueue(
      jsonb_build_object('type', 'email_changed', 'userId', NEW.id, 'oldEmail', OLD.email));
  ELSIF OLD.email_confirmed_at IS NULL AND NEW.email_confirmed_at IS NOT NULL THEN
    PERFORM public._newsletter_sync_enqueue(jsonb_build_object('type', 'upsert_user', 'userId', NEW.id));
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  RAISE WARNING '[newsletter] auth trigger failed: %', SQLERRM;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_newsletter_auth_user ON auth.users;
CREATE TRIGGER trg_newsletter_auth_user
  AFTER UPDATE OF email, email_confirmed_at OR DELETE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public._newsletter_on_auth_user_change();

-- Webhook path: an unsubscribe/resubscribe in Resend sets the app's switch.
-- Returns true only when something changed (no echo loop).
CREATE OR REPLACE FUNCTION public._newsletter_set_preference(p_email text, p_subscribed boolean)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_rows int;
BEGIN
  UPDATE public.profiles p
     SET notification_preferences =
           coalesce(p.notification_preferences, '{}'::jsonb) || jsonb_build_object('email_newsletter', p_subscribed)
   WHERE p.id IN (SELECT u.id FROM auth.users u WHERE lower(u.email) = lower(p_email))
     -- Absent means "on", so only an explicit 'false' counts as off.
     AND (coalesce(p.notification_preferences ->> 'email_newsletter', 'true') = 'false') <> (NOT p_subscribed);
  GET DIAGNOSTICS v_rows = ROW_COUNT;
  RETURN v_rows > 0;
END;
$$;

REVOKE ALL ON FUNCTION public._newsletter_set_preference(text, boolean) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public._newsletter_set_preference(text, boolean) TO service_role;
