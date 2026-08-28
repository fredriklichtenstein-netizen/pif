-- Supports the new unsubscribe-notification edge function: a small,
-- allowlisted RPC that flips one key in profiles.notification_preferences
-- to false, merging into the existing JSONB rather than overwriting it (so
-- a user's other preference choices survive untouched). Called with the
-- service-role key from the edge function after verifying a signed token
-- -- the allowlist here is defence in depth against a bug ever passing
-- through an arbitrary key.
CREATE OR REPLACE FUNCTION public.set_notification_preference(
  p_user_id uuid,
  p_key text,
  p_value boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF p_key NOT IN ('email_messages', 'email_mentions', 'email_item_updates', 'email_announcements') THEN
    RAISE EXCEPTION 'Invalid notification preference key: %', p_key;
  END IF;

  UPDATE public.profiles
  SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || jsonb_build_object(p_key, p_value)
  WHERE id = p_user_id;
END;
$$;

-- service_role only (the edge function's admin client) -- this must not be
-- callable directly by anon/authenticated, since it takes an arbitrary
-- p_user_id with no auth.uid() check of its own; the edge function is
-- what enforces "only the token holder for THIS user+key can call it".
REVOKE ALL ON FUNCTION public.set_notification_preference(uuid, text, boolean) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_notification_preference(uuid, text, boolean) TO service_role;
