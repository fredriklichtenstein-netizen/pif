-- User blocking (Apple guideline 1.2; Trello G3.6). Idempotent.
--
-- A block works both ways: neither person sees the other's posts or comments,
-- and neither can message, comment on the other's posts or show interest in
-- them. The guards live here, in the database, so an old app build or a
-- direct API call can't get round them. The blocked person is never told.

CREATE TABLE IF NOT EXISTS public.user_blocks (
  blocker_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (blocker_id, blocked_id),
  CHECK (blocker_id <> blocked_id)
);
CREATE INDEX IF NOT EXISTS user_blocks_blocked_id_idx ON public.user_blocks (blocked_id);

ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_blocks_select_own" ON public.user_blocks;
CREATE POLICY "user_blocks_select_own" ON public.user_blocks
  FOR SELECT TO authenticated USING (blocker_id = (SELECT auth.uid()));
REVOKE ALL ON public.user_blocks FROM anon, authenticated;
GRANT SELECT ON public.user_blocks TO authenticated;

-- True when either user has blocked the other. Internal: used by the guards.
CREATE OR REPLACE FUNCTION public.is_blocked_between(p_a uuid, p_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT p_a IS NOT NULL AND p_b IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.user_blocks
    WHERE (blocker_id = p_a AND blocked_id = p_b)
       OR (blocker_id = p_b AND blocked_id = p_a)
  );
$function$;
REVOKE ALL ON FUNCTION public.is_blocked_between(uuid, uuid) FROM PUBLIC, anon, authenticated;

DROP FUNCTION IF EXISTS public.block_user(uuid);
CREATE FUNCTION public.block_user(p_user_id uuid) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := (SELECT auth.uid());
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_user_id IS NULL OR p_user_id = v_uid THEN RAISE EXCEPTION 'invalid user'; END IF;
  INSERT INTO public.user_blocks (blocker_id, blocked_id)
  VALUES (v_uid, p_user_id)
  ON CONFLICT DO NOTHING;
END;
$function$;

DROP FUNCTION IF EXISTS public.unblock_user(uuid);
CREATE FUNCTION public.unblock_user(p_user_id uuid) RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  DELETE FROM public.user_blocks WHERE blocker_id = (SELECT auth.uid()) AND blocked_id = p_user_id;
$function$;

-- Everyone the app should hide from the signed-in user: people they blocked
-- and people who blocked them (ids only, no direction).
DROP FUNCTION IF EXISTS public.get_hidden_user_ids();
CREATE FUNCTION public.get_hidden_user_ids() RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT blocked_id FROM public.user_blocks WHERE blocker_id = (SELECT auth.uid())
  UNION
  SELECT blocker_id FROM public.user_blocks WHERE blocked_id = (SELECT auth.uid());
$function$;

-- The Settings list: the people I blocked, with display fields only.
DROP FUNCTION IF EXISTS public.get_my_blocked_users();
CREATE FUNCTION public.get_my_blocked_users()
RETURNS TABLE (user_id uuid, first_name text, last_name text, avatar_url text, blocked_at timestamptz)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT b.blocked_id, p.first_name, p.last_name, p.avatar_url, b.created_at
  FROM public.user_blocks b
  JOIN public.profiles p ON p.id = b.blocked_id
  WHERE b.blocker_id = (SELECT auth.uid())
  ORDER BY b.created_at DESC;
$function$;

REVOKE ALL ON FUNCTION public.block_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.unblock_user(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_hidden_user_ids() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.get_my_blocked_users() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.block_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unblock_user(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hidden_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_blocked_users() TO authenticated;

-- ---- Guards. Error message 'user_blocked' is what the app looks for. ----

-- Messages: nobody can write in a conversation with someone they're blocked with.
CREATE OR REPLACE FUNCTION public._guard_blocked_message() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF coalesce(new.is_system_message, false) OR new.sender_id IS NULL THEN
    RETURN new;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = new.conversation_id
      AND cp.user_id <> new.sender_id
      AND public.is_blocked_between(cp.user_id, new.sender_id)
  ) THEN
    RAISE EXCEPTION 'user_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN new;
END;
$function$;
DROP TRIGGER IF EXISTS trg_guard_blocked_message ON public.messages;
CREATE TRIGGER trg_guard_blocked_message
  BEFORE INSERT ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public._guard_blocked_message();

-- Conversations: can't add someone to a conversation with a person they're blocked with.
CREATE OR REPLACE FUNCTION public._guard_blocked_participant() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.conversation_participants cp
    WHERE cp.conversation_id = new.conversation_id
      AND cp.user_id <> new.user_id
      AND public.is_blocked_between(cp.user_id, new.user_id)
  ) THEN
    RAISE EXCEPTION 'user_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN new;
END;
$function$;
DROP TRIGGER IF EXISTS trg_guard_blocked_participant ON public.conversation_participants;
CREATE TRIGGER trg_guard_blocked_participant
  BEFORE INSERT ON public.conversation_participants
  FOR EACH ROW EXECUTE FUNCTION public._guard_blocked_participant();

-- Comments: not on a post by someone you're blocked with, and no reply to
-- their comment.
CREATE OR REPLACE FUNCTION public._guard_blocked_comment() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_blocked_between(new.user_id, (SELECT user_id FROM public.items WHERE id = new.item_id))
     OR (new.parent_id IS NOT NULL AND public.is_blocked_between(
           new.user_id, (SELECT user_id FROM public.comments WHERE id = new.parent_id))) THEN
    RAISE EXCEPTION 'user_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN new;
END;
$function$;
DROP TRIGGER IF EXISTS trg_guard_blocked_comment ON public.comments;
CREATE TRIGGER trg_guard_blocked_comment
  BEFORE INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public._guard_blocked_comment();

-- Interest: not in a post by someone you're blocked with.
CREATE OR REPLACE FUNCTION public._guard_blocked_interest() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF public.is_blocked_between(new.user_id, (SELECT user_id FROM public.items WHERE id = new.item_id)) THEN
    RAISE EXCEPTION 'user_blocked' USING ERRCODE = 'P0001';
  END IF;
  RETURN new;
END;
$function$;
DROP TRIGGER IF EXISTS trg_guard_blocked_interest ON public.interests;
CREATE TRIGGER trg_guard_blocked_interest
  BEFORE INSERT ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public._guard_blocked_interest();

-- Notifications caused by someone you're blocked with are dropped silently
-- (and so are their pushes, which hang off the notification insert).
CREATE OR REPLACE FUNCTION public._skip_blocked_notification() RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_actor uuid;
BEGIN
  BEGIN
    v_actor := nullif(new.payload ->> 'actor_id', '')::uuid;
  EXCEPTION WHEN others THEN
    v_actor := NULL;
  END;
  IF v_actor IS NOT NULL AND public.is_blocked_between(new.user_id, v_actor) THEN
    RETURN NULL;
  END IF;
  RETURN new;
END;
$function$;
DROP TRIGGER IF EXISTS trg_skip_blocked_notification ON public.notifications;
CREATE TRIGGER trg_skip_blocked_notification
  BEFORE INSERT ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public._skip_blocked_notification();

-- Reports can now be about a person, not only a post.
ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS reported_user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Comment notifications: skip recipients who are blocked with the commenter.
-- The notification itself would be dropped by the trigger above, but this
-- function also sends the email directly, so it has to check too.
-- Body = live 2026-11-20 (same md5 on staging and production) + the CONTINUE.
CREATE OR REPLACE FUNCTION public.notify_comment_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_owner uuid;
  v_item_title text;
  v_actor_name text;
  v_thread_root bigint;
  v_rec record;
  v_owner_notified boolean := false;
BEGIN
  SELECT user_id, title INTO v_owner, v_item_title
    FROM public.items WHERE id = new.item_id;

  SELECT coalesce(nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), ''), 'Någon')
    INTO v_actor_name
    FROM public.profiles WHERE id = new.user_id;

  v_thread_root := coalesce(new.parent_id, new.id);

  FOR v_rec IN
    SELECT recipient_id, bool_or(is_direct_parent) AS is_direct_parent
    FROM (
      SELECT c.user_id AS recipient_id, true AS is_direct_parent
        FROM public.comments c
       WHERE new.parent_id IS NOT NULL AND c.id = new.parent_id AND c.user_id <> new.user_id

      UNION ALL

      SELECT c.user_id AS recipient_id, false AS is_direct_parent
        FROM public.comments c
       WHERE (c.id = v_thread_root OR c.parent_id = v_thread_root)
         AND c.user_id <> new.user_id
    ) x
    GROUP BY recipient_id
  LOOP
    IF v_rec.recipient_id = v_owner THEN
      v_owner_notified := true;
    END IF;

    IF public.is_blocked_between(v_rec.recipient_id, new.user_id) THEN
      CONTINUE;
    END IF;

    PERFORM public.create_notification(
      p_user_id => v_rec.recipient_id,
      p_type    => CASE WHEN v_rec.is_direct_parent THEN 'comment_reply' ELSE 'thread_comment' END,
      p_payload => jsonb_build_object(
        'title', CASE WHEN v_rec.is_direct_parent
                       THEN v_actor_name || ' svarade på din kommentar i "' || coalesce(v_item_title, '') || '".'
                       ELSE v_actor_name || ' kommenterade i en tråd du är med i, i "' || coalesce(v_item_title, '') || '".'
                  END,
        'actor_id', new.user_id,
        'actor_name', v_actor_name,
        'item_id', new.item_id,
        'item_title', v_item_title,
        'comment_id', new.id,
        'reference_id', new.id::text,
        'reference_type', 'comment',
        'action_url', '/item/' || new.item_id::text || '?comment=' || new.id::text
      )
    );

    PERFORM public._trigger_notification_email(
      p_user_id  => v_rec.recipient_id,
      p_type     => 'new_comment',
      p_pref_key => 'email_mentions',
      p_data     => jsonb_build_object(
        'commentType', CASE WHEN v_rec.is_direct_parent THEN 'comment_reply' ELSE 'thread_comment' END,
        'commenterName', v_actor_name,
        'itemId', new.item_id,
        'itemTitle', v_item_title,
        'commentContent', new.content,
        'commentId', new.id
      )
    );
  END LOOP;

  IF v_owner IS NOT NULL AND v_owner <> new.user_id AND NOT v_owner_notified THEN
    PERFORM public.create_notification(
      p_user_id => v_owner,
      p_type    => 'post_commented',
      p_payload => jsonb_build_object(
        'title', v_actor_name || ' kommenterade ditt inlägg "' || coalesce(v_item_title, '') || '".',
        'actor_id', new.user_id,
        'actor_name', v_actor_name,
        'item_id', new.item_id,
        'item_title', v_item_title,
        'comment_id', new.id,
        'reference_id', new.id::text,
        'reference_type', 'comment',
        'action_url', '/item/' || new.item_id::text || '?comment=' || new.id::text
      )
    );

    PERFORM public._trigger_notification_email(
      p_user_id  => v_owner,
      p_type     => 'new_comment',
      p_pref_key => 'email_item_updates',
      p_data     => jsonb_build_object(
        'commentType', 'post_commented',
        'commenterName', v_actor_name,
        'itemId', new.item_id,
        'itemTitle', v_item_title,
        'commentContent', new.content,
        'commentId', new.id
      )
    );
  END IF;

  RETURN new;
END;
$function$;
