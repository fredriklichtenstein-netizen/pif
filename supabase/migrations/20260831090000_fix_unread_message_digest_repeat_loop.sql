-- Bug: _send_unread_message_digests() (run every 15 min via pg_cron job
-- "send-unread-message-digests") re-notified a user about the SAME unread
-- message every 6 hours, forever, for as long as it stayed unread.
--
-- Root cause: the "is there an unread message" subquery only filtered on
-- cp.last_read_at, never on cp.last_unread_notified_at. So once a message
-- crossed the 6h "still unread" threshold and a digest fired,
-- last_unread_notified_at was set to now() -- but the SAME message (still
-- the oldest unread one, since the user hadn't read it) kept being found on
-- every subsequent run. The one guard against that,
-- `last_unread_notified_at > now() - interval '6 hours'`, only suppressed
-- re-firing WITHIN that 6h window, not permanently -- so as soon as the
-- window elapsed the same old message fired again. Net effect: an
-- unbounded repeat every 6 hours until the user opened the conversation.
--
-- Fix: only consider messages that arrived AFTER the last notification as
-- candidates for "unread and notifiable" (in addition to the existing
-- "after last_read_at" check). Once a conversation has been notified about,
-- the old unread messages that triggered it can never trigger it again --
-- only a genuinely new message (arriving after that notification) can, and
-- it still has to sit unread for 6h first, same as before. This makes the
-- separate `last_unread_notified_at > now() - interval '6 hours'` guard
-- redundant (a fresh notification now requires a message newer than
-- last_unread_notified_at that is itself already 6h+ old, which is
-- logically impossible to satisfy inside the same 6h window), so it's
-- dropped rather than left as confusing dead code.
CREATE OR REPLACE FUNCTION public._send_unread_message_digests()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rec record;
  v_sender_name text;
BEGIN
  FOR v_rec IN
    SELECT cp.conversation_id, cp.user_id, cp.last_read_at, cp.last_unread_notified_at,
           (
             SELECT m.sender_id
             FROM public.messages m
             WHERE m.conversation_id = cp.conversation_id
               AND m.sender_id <> cp.user_id
               AND m.is_system_message = false
               AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
               AND (cp.last_unread_notified_at IS NULL OR m.created_at > cp.last_unread_notified_at)
             ORDER BY m.created_at DESC
             LIMIT 1
           ) AS last_sender_id,
           (
             SELECT MIN(m.created_at)
             FROM public.messages m
             WHERE m.conversation_id = cp.conversation_id
               AND m.sender_id <> cp.user_id
               AND m.is_system_message = false
               AND (cp.last_read_at IS NULL OR m.created_at > cp.last_read_at)
               AND (cp.last_unread_notified_at IS NULL OR m.created_at > cp.last_unread_notified_at)
           ) AS earliest_unread_at
    FROM public.conversation_participants cp
  LOOP
    CONTINUE WHEN v_rec.last_sender_id IS NULL;
    CONTINUE WHEN v_rec.earliest_unread_at > now() - interval '6 hours';

    SELECT coalesce(nullif(trim(coalesce(first_name,'') || ' ' || coalesce(last_name,'')), ''), 'din granne')
      INTO v_sender_name
      FROM public.profiles WHERE id = v_rec.last_sender_id;

    PERFORM public._trigger_notification_email(
      p_user_id  => v_rec.user_id,
      p_type     => 'new_message_digest',
      p_pref_key => 'email_messages',
      p_data     => jsonb_build_object(
        'otherUserName', v_sender_name,
        'conversationId', v_rec.conversation_id
      )
    );

    UPDATE public.conversation_participants
      SET last_unread_notified_at = now()
      WHERE conversation_id = v_rec.conversation_id AND user_id = v_rec.user_id;
  END LOOP;
END;
$function$;
