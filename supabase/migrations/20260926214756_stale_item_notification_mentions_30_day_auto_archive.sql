-- Back-filled from production's supabase_migrations.schema_migrations (already applied
-- there as version 20260926214756); recorded here so the repo matches live.
CREATE OR REPLACE FUNCTION public._process_stale_items()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_item record;
  v_days_open integer;
  v_next_stage integer;
  v_milestone_days integer;
  v_has_selected boolean;
  v_has_pending boolean;
  v_cta text;
  v_receiver record;
  v_receiver_cta text;
  v_noun text;
  v_is_final boolean;
  v_batch jsonb := '[]'::jsonb;
  v_url text;
  v_secret text;
BEGIN
  FOR v_item IN
    SELECT * FROM public.items WHERE pif_status = 'active'
  LOOP
    v_noun := CASE WHEN v_item.item_type = 'offer' THEN 'piff' ELSE 'önskan' END;
    v_days_open := floor(extract(epoch FROM (now() - v_item.stale_reminder_clock_start)) / 86400)::int;

    IF v_days_open >= 30 THEN
      UPDATE public.items
        SET pif_status = 'archived',
            archived_at = now(),
            archived_reason = 'Automatiskt arkiverad efter 30 dagar'
        WHERE id = v_item.id;

      PERFORM public.create_notification(
        p_user_id => v_item.user_id,
        p_type    => 'item_force_archived',
        p_payload => jsonb_build_object(
          'title', 'Din ' || v_noun || ' "' || coalesce(v_item.title, '') || '" har arkiverats automatiskt efter 30 dagar.',
          'item_id', v_item.id,
          'item_title', v_item.title,
          'reference_id', v_item.id::text,
          'reference_type', 'item',
          'action_url', '/item/' || v_item.id::text
        )
      );

      v_batch := v_batch || jsonb_build_object(
        'userId', v_item.user_id,
        'type', 'item_force_archived',
        'itemId', v_item.id,
        'itemTitle', v_item.title,
        'itemType', v_item.item_type
      );

      FOR v_receiver IN
        SELECT user_id FROM public.interests WHERE item_id = v_item.id AND status = 'selected'
      LOOP
        PERFORM public.create_notification(
          p_user_id => v_receiver.user_id,
          p_type    => 'item_force_archived',
          p_payload => jsonb_build_object(
            'title', 'Piffen/önskan "' || coalesce(v_item.title, '') || '" som du var vald för har arkiverats automatiskt efter 30 dagar.',
            'item_id', v_item.id,
            'item_title', v_item.title,
            'reference_id', v_item.id::text,
            'reference_type', 'item',
            'action_url', '/item/' || v_item.id::text
          )
        );

        v_batch := v_batch || jsonb_build_object(
          'userId', v_receiver.user_id,
          'type', 'item_force_archived',
          'itemId', v_item.id,
          'itemTitle', v_item.title,
          'itemType', v_item.item_type
        );
      END LOOP;

      CONTINUE;
    END IF;

    v_next_stage := v_item.stale_reminder_stage + 1;
    v_milestone_days := CASE v_next_stage
      WHEN 1 THEN 7 WHEN 2 THEN 14 WHEN 3 THEN 21 WHEN 4 THEN 28 ELSE NULL
    END;

    IF v_milestone_days IS NULL OR v_days_open < v_milestone_days THEN
      CONTINUE;
    END IF;

    v_is_final := (v_next_stage = 4);

    SELECT
      bool_or(status = 'selected'),
      bool_or(status = 'pending')
      INTO v_has_selected, v_has_pending
      FROM public.interests WHERE item_id = v_item.id;

    IF v_item.item_type = 'offer' THEN
      IF v_has_selected THEN
        v_cta := CASE WHEN NOT v_item.piffer_confirmed_handoff THEN 'confirm_handoff' ELSE 'awaiting_receiver' END;
      ELSIF v_has_pending THEN
        v_cta := 'select_receiver';
      ELSE
        v_cta := 'no_interest';
      END IF;
    ELSE
      IF v_has_selected THEN
        v_cta := 'mark_granted';
      ELSIF v_has_pending THEN
        v_cta := 'select_fulfiller';
      ELSE
        v_cta := 'no_interest';
      END IF;
    END IF;

    PERFORM public.create_notification(
      p_user_id => v_item.user_id,
      p_type    => 'stale_item_owner',
      p_payload => jsonb_build_object(
        'title', 'Din ' || v_noun || ' "' || coalesce(v_item.title, '') || '" har varit öppen i ' || v_days_open || ' dagar. Piffar och önskningar som inte avslutas arkiveras automatiskt efter 30 dagar.',
        'item_id', v_item.id,
        'item_title', v_item.title,
        'cta', v_cta,
        'reference_id', v_item.id::text,
        'reference_type', 'item',
        'action_url', '/item/' || v_item.id::text
      )
    );

    v_batch := v_batch || jsonb_build_object(
      'userId', v_item.user_id,
      'type', 'stale_item_reminder',
      'itemId', v_item.id,
      'itemTitle', v_item.title,
      'itemType', v_item.item_type,
      'daysOpen', v_days_open,
      'ctaKind', v_cta,
      'isFinalReminder', v_is_final
    );

    IF v_has_selected THEN
      FOR v_receiver IN
        SELECT user_id FROM public.interests WHERE item_id = v_item.id AND status = 'selected'
      LOOP
        IF v_item.item_type = 'offer' THEN
          v_receiver_cta := CASE WHEN NOT v_item.receiver_confirmed_receipt THEN 'confirm_receipt' ELSE 'awaiting_owner' END;
        ELSE
          v_receiver_cta := 'check_in';
        END IF;

        PERFORM public.create_notification(
          p_user_id => v_receiver.user_id,
          p_type    => 'stale_item_receiver',
          p_payload => jsonb_build_object(
            'title', 'Det har gått ' || v_days_open || ' dagar sedan du blev vald för "' || coalesce(v_item.title, '') || '".',
            'item_id', v_item.id,
            'item_title', v_item.title,
            'cta', v_receiver_cta,
            'reference_id', v_item.id::text,
            'reference_type', 'item',
            'action_url', '/item/' || v_item.id::text
          )
        );

        v_batch := v_batch || jsonb_build_object(
          'userId', v_receiver.user_id,
          'type', 'stale_item_reminder',
          'itemId', v_item.id,
          'itemTitle', v_item.title,
          'itemType', v_item.item_type,
          'daysOpen', v_days_open,
          'ctaKind', v_receiver_cta,
          'isFinalReminder', v_is_final
        );
      END LOOP;
    END IF;

    UPDATE public.items SET stale_reminder_stage = v_next_stage WHERE id = v_item.id;
  END LOOP;

  IF jsonb_array_length(v_batch) > 0 THEN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'notification_email_function_url';
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
    IF v_url IS NOT NULL AND v_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url => v_url,
        headers => jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
        body => jsonb_build_object('type', 'stale_item_reminders_batch', 'items', v_batch)
      );
    END IF;
  END IF;
END;
$function$;
