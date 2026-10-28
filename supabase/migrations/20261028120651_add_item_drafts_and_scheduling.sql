-- Drafts and scheduled publishing for pifs/wishes.
--
-- Drafts live in their own owner-only table instead of a new items.pif_status:
-- items has a public-read RLS policy (qual = true) and every feed/owner query
-- treats any status other than archived/completed as "active", so a draft row
-- in items would leak into the feed, map, share previews and sitemap unless
-- every one of ~29 queries were changed. Publishing copies the draft into
-- items (created_at / stale clock = publish time) and deletes the draft.
--
-- Idempotent: safe to replay on a fresh branch and to promote separately.

CREATE TABLE IF NOT EXISTS public.item_drafts (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES public.profiles(id) ON DELETE CASCADE,
  item_type text NOT NULL DEFAULT 'offer' CHECK (item_type IN ('offer', 'request')),
  title text,
  description text,
  category text,
  condition text,
  images text[] NOT NULL DEFAULT '{}',
  image_crops jsonb,
  location text,
  coordinates_json jsonb,
  measurements jsonb,
  visibility_radius_km numeric,
  pickup_preference text CHECK (pickup_preference IS NULL OR pickup_preference IN ('meetup', 'leave_at_door', 'flexible')),
  pickup_address text,
  pickup_door_code text,
  pickup_instructions text,
  pickup_floor integer,
  preferred_time_window text,
  phone text,
  scheduled_at timestamptz,
  publish_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS item_drafts_user_id_idx ON public.item_drafts (user_id);
CREATE INDEX IF NOT EXISTS item_drafts_scheduled_at_idx ON public.item_drafts (scheduled_at) WHERE scheduled_at IS NOT NULL;

ALTER TABLE public.item_drafts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Own drafts select" ON public.item_drafts;
CREATE POLICY "Own drafts select" ON public.item_drafts FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own drafts insert" ON public.item_drafts;
CREATE POLICY "Own drafts insert" ON public.item_drafts FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own drafts update" ON public.item_drafts;
CREATE POLICY "Own drafts update" ON public.item_drafts FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));
DROP POLICY IF EXISTS "Own drafts delete" ON public.item_drafts;
CREATE POLICY "Own drafts delete" ON public.item_drafts FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

REVOKE ALL ON public.item_drafts FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.item_drafts TO authenticated;

-- Fields a draft needs before it can be published or scheduled. Mirrors the
-- post form's client-side validation (usePostFormSubmission).
CREATE OR REPLACE FUNCTION public._draft_missing_fields(d public.item_drafts)
RETURNS text[]
LANGUAGE sql
IMMUTABLE
SET search_path TO 'public'
AS $$
  SELECT array_remove(ARRAY[
    CASE WHEN coalesce(btrim(d.title), '') = '' THEN 'title' END,
    CASE WHEN d.category IS NULL OR d.category = '' THEN 'category' END,
    CASE WHEN d.condition IS NULL OR d.condition = '' THEN 'condition' END,
    CASE WHEN d.coordinates_json IS NULL
           OR d.coordinates_json->>'lat' IS NULL
           OR d.coordinates_json->>'lng' IS NULL THEN 'coordinates' END,
    CASE WHEN coalesce(cardinality(d.images), 0) = 0 THEN 'images' END
  ], NULL);
$$;

-- updated_at bookkeeping + scheduling guards. A scheduled draft must stay
-- publishable (so the cron job essentially never fails), and a new schedule
-- must be in the future and at most 30 days out.
CREATE OR REPLACE FUNCTION public._item_drafts_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
DECLARE
  v_missing text[];
BEGIN
  NEW.updated_at := now();

  IF NEW.scheduled_at IS NOT NULL THEN
    IF TG_OP = 'INSERT' OR NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
      IF NEW.scheduled_at < now() - interval '5 minutes' THEN
        RAISE EXCEPTION 'schedule_in_past' USING ERRCODE = 'P0001';
      END IF;
      IF NEW.scheduled_at > now() + interval '30 days 10 minutes' THEN
        RAISE EXCEPTION 'schedule_too_far' USING ERRCODE = 'P0001';
      END IF;
      NEW.publish_error := NULL;
    END IF;

    v_missing := public._draft_missing_fields(NEW);
    IF cardinality(v_missing) > 0 THEN
      RAISE EXCEPTION 'draft_incomplete' USING ERRCODE = 'P0001', DETAIL = array_to_string(v_missing, ',');
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_item_drafts_before_write ON public.item_drafts;
CREATE TRIGGER trg_item_drafts_before_write
  BEFORE INSERT OR UPDATE ON public.item_drafts
  FOR EACH ROW EXECUTE FUNCTION public._item_drafts_before_write();

-- Core publish: copy the draft into items and delete it. No auth check of its
-- own -- callable only by the owner-checking wrapper below and by cron.
CREATE OR REPLACE FUNCTION public._publish_draft(p_draft_id bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  d public.item_drafts;
  v_missing text[];
  v_item_id bigint;
BEGIN
  SELECT * INTO d FROM public.item_drafts WHERE id = p_draft_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'draft_not_found' USING ERRCODE = 'P0002';
  END IF;

  v_missing := public._draft_missing_fields(d);
  IF cardinality(v_missing) > 0 THEN
    RAISE EXCEPTION 'draft_incomplete' USING ERRCODE = 'P0001', DETAIL = array_to_string(v_missing, ',');
  END IF;

  INSERT INTO public.items (
    user_id, title, description, category, condition, item_type, pif_status,
    images, image_crops, location, coordinates_json, measurements,
    visibility_radius_km, pickup_preference, pickup_address, pickup_door_code,
    pickup_instructions, pickup_floor, preferred_time_window, phone,
    created_at, stale_reminder_clock_start
  ) VALUES (
    d.user_id, btrim(d.title), d.description, d.category, d.condition, d.item_type, 'active',
    d.images, coalesce(d.image_crops, '[]'::jsonb), d.location, d.coordinates_json, d.measurements,
    d.visibility_radius_km, d.pickup_preference, d.pickup_address, d.pickup_door_code,
    d.pickup_instructions, d.pickup_floor, d.preferred_time_window, d.phone,
    now(), now()
  )
  RETURNING id INTO v_item_id;

  DELETE FROM public.item_drafts WHERE id = p_draft_id;
  RETURN v_item_id;
END;
$$;

REVOKE ALL ON FUNCTION public._publish_draft(bigint) FROM PUBLIC, anon, authenticated;

-- "Publicera nu" from the app.
CREATE OR REPLACE FUNCTION public.publish_draft(p_draft_id bigint)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_owner uuid;
BEGIN
  SELECT user_id INTO v_owner FROM public.item_drafts WHERE id = p_draft_id;
  IF v_owner IS NULL OR (SELECT auth.uid()) IS NULL OR v_owner <> (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'draft_not_found' USING ERRCODE = 'P0002';
  END IF;
  RETURN public._publish_draft(p_draft_id);
END;
$$;

REVOKE ALL ON FUNCTION public.publish_draft(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.publish_draft(bigint) TO authenticated;

-- Every 5 minutes: publish due drafts, notify owners (in-app gated by
-- push_scheduled_published, email by email_scheduled_published inside
-- send-notification-email; both opt-out). A failure keeps the draft, clears
-- its schedule and always notifies (mandatory, like item_force_archived).
CREATE OR REPLACE FUNCTION public._publish_scheduled_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_draft record;
  v_item_id bigint;
  v_noun text;
  v_title text;
  v_prefs jsonb;
  v_batch jsonb := '[]'::jsonb;
  v_url text;
  v_secret text;
BEGIN
  FOR v_draft IN
    SELECT id, user_id, title, item_type
    FROM public.item_drafts
    WHERE scheduled_at IS NOT NULL AND scheduled_at <= now()
    ORDER BY scheduled_at
    FOR UPDATE SKIP LOCKED
  LOOP
    v_noun := CASE WHEN v_draft.item_type = 'offer' THEN 'piff' ELSE 'önskan' END;
    v_title := coalesce(btrim(v_draft.title), '');

    BEGIN
      v_item_id := public._publish_draft(v_draft.id);

      SELECT notification_preferences INTO v_prefs FROM public.profiles WHERE id = v_draft.user_id;
      IF coalesce((v_prefs->>'push_scheduled_published')::boolean, true) THEN
        PERFORM public.create_notification(
          p_user_id => v_draft.user_id,
          p_type    => 'scheduled_item_published',
          p_payload => jsonb_build_object(
            'title', 'Din schemalagda ' || v_noun || ' "' || v_title || '" är nu publicerad.',
            'item_id', v_item_id,
            'item_title', v_title,
            'reference_id', v_item_id::text,
            'reference_type', 'item',
            'action_url', '/item/' || v_item_id::text
          )
        );
      END IF;

      v_batch := v_batch || jsonb_build_object(
        'userId', v_draft.user_id,
        'type', 'scheduled_item_published',
        'itemId', v_item_id,
        'itemTitle', v_title,
        'itemType', v_draft.item_type
      );
    EXCEPTION WHEN OTHERS THEN
      UPDATE public.item_drafts
        SET scheduled_at = NULL, publish_error = SQLERRM
        WHERE id = v_draft.id;

      PERFORM public.create_notification(
        p_user_id => v_draft.user_id,
        p_type    => 'scheduled_item_failed',
        p_payload => jsonb_build_object(
          'title', 'Din schemalagda ' || v_noun || ' "' || v_title || '" kunde inte publiceras. Den finns kvar bland dina utkast.',
          'reference_id', v_draft.id::text,
          'reference_type', 'item_draft',
          'action_url', '/drafts'
        )
      );

      v_batch := v_batch || jsonb_build_object(
        'userId', v_draft.user_id,
        'type', 'scheduled_item_failed',
        'itemTitle', v_title,
        'itemType', v_draft.item_type
      );
    END;
  END LOOP;

  IF jsonb_array_length(v_batch) > 0 THEN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'notification_email_function_url';
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
    IF v_url IS NOT NULL AND v_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url => v_url,
        headers => jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
        body => jsonb_build_object('type', 'notification_batch', 'items', v_batch)
      );
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._publish_scheduled_drafts() FROM PUBLIC, anon, authenticated;

-- Daily: delete unscheduled drafts untouched for 90 days. Their images can't
-- be removed from SQL (storage.objects protect_delete trigger), so the paths
-- go to the purge-draft-images edge function in one batched call.
CREATE OR REPLACE FUNCTION public._cleanup_stale_drafts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_batch jsonb;
  v_url text;
  v_secret text;
BEGIN
  WITH deleted AS (
    DELETE FROM public.item_drafts
    WHERE scheduled_at IS NULL AND updated_at < now() - interval '90 days'
    RETURNING user_id, images
  )
  SELECT jsonb_agg(jsonb_build_object('userId', user_id, 'images', to_jsonb(images)))
    INTO v_batch
    FROM deleted
    WHERE cardinality(images) > 0;

  IF v_batch IS NOT NULL THEN
    SELECT decrypted_secret INTO v_url FROM vault.decrypted_secrets WHERE name = 'notification_email_function_url';
    SELECT decrypted_secret INTO v_secret FROM vault.decrypted_secrets WHERE name = 'internal_function_secret';
    IF v_url IS NOT NULL AND v_secret IS NOT NULL THEN
      PERFORM net.http_post(
        url => replace(v_url, 'send-notification-email', 'purge-draft-images'),
        headers => jsonb_build_object('Content-Type', 'application/json', 'x-internal-secret', v_secret),
        body => jsonb_build_object('drafts', v_batch)
      );
    END IF;
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public._cleanup_stale_drafts() FROM PUBLIC, anon, authenticated;

-- Allow the unsubscribe link for the new email type.
CREATE OR REPLACE FUNCTION public.set_notification_preference(p_user_id uuid, p_key text, p_value boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF p_key NOT IN ('email_messages', 'email_mentions', 'email_item_updates', 'email_announcements', 'email_scheduled_published') THEN
    RAISE EXCEPTION 'Invalid notification preference key: %', p_key;
  END IF;

  UPDATE public.profiles
  SET notification_preferences = COALESCE(notification_preferences, '{}'::jsonb) || jsonb_build_object(p_key, p_value)
  WHERE id = p_user_id;
END;
$$;

-- cron.schedule with a job name upserts, so replaying this is safe.
SELECT cron.schedule('publish-scheduled-drafts', '*/5 * * * *', 'SELECT public._publish_scheduled_drafts();');
SELECT cron.schedule('cleanup-stale-drafts', '30 3 * * *', 'SELECT public._cleanup_stale_drafts();');
