-- Wish handover per helper (Trello #141, decided by Fredrik 2026-11-27: "per helper, the
-- wisher closes it").
--
-- A wish can have several chosen helpers, but the handover was confirmed once per post
-- (items.piffer_confirmed_handoff / receiver_confirmed_receipt): when the wisher marked helper 1
-- done, helper 2's chat said "the wisher has confirmed", and if helper 2 then confirmed, the
-- wish completed and both counted as having fulfilled it.
--
-- Now each chosen helper's interest row carries its own handover:
--   interests.owner_confirmed_at  -- the wisher confirmed this helper fulfilled the wish
--   interests.helper_confirmed_at -- the helper confirmed it
-- Confirming never completes the wish; the wisher closes it with complete_wish() (or
-- "Markera som klar ändå" / "Uppfylld utanför appen" as before). Pifs are unchanged: one
-- receiver, the post-level flags, completed when both confirm.
--
-- Old callers keep working (installed app builds): confirm_pif_handoff / undo_pif_handoff_
-- confirmation on a wish act on the caller's own helper row, or on the only chosen helper for
-- the wisher; with several chosen helpers the wisher must use the new per-helper functions.
--
-- Ratings and the profile count follow the per-helper handover: a helper may rate the wisher
-- once both have confirmed their handover (or the wish is completed), and "wishes fulfilled"
-- counts helpers the wisher confirmed (or, for a wish closed without confirmations, every
-- chosen helper, as before). Production had no chosen wish helpers on 2026-11-27, so no
-- backfill is needed there; staging rows from before this are backfilled from the post flags.
-- Additive and idempotent.

ALTER TABLE public.interests ADD COLUMN IF NOT EXISTS owner_confirmed_at timestamptz;
ALTER TABLE public.interests ADD COLUMN IF NOT EXISTS helper_confirmed_at timestamptz;
GRANT SELECT (owner_confirmed_at, helper_confirmed_at) ON public.interests TO anon, authenticated;

-- Backfill (staging test data): a completed wish's chosen helpers were confirmed at completion.
UPDATE public.interests i
   SET owner_confirmed_at = coalesce(i.owner_confirmed_at, it.completed_at),
       helper_confirmed_at = coalesce(i.helper_confirmed_at, CASE WHEN it.receiver_confirmed_receipt THEN it.completed_at END)
  FROM public.items it
 WHERE it.id = i.item_id AND it.item_type = 'request' AND it.pif_status = 'completed'
   AND i.status = 'selected' AND it.piffer_confirmed_handoff AND i.owner_confirmed_at IS NULL;

-- ---------------------------------------------------------------------------------------------
-- Per-helper confirm / undo. p_role: 'owner' (the wisher, for p_helper_id) or 'helper' (the
-- caller, for their own row; p_helper_id may be NULL or the caller).
CREATE OR REPLACE FUNCTION public.confirm_wish_handoff(p_item_id bigint, p_helper_id uuid, p_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_owner uuid; v_type text; v_status text; v_archived timestamptz;
  v_helper uuid;
  v_row public.interests;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT user_id, lower(coalesce(item_type, 'offer')), coalesce(pif_status, 'active'), archived_at
    INTO v_owner, v_type, v_status, v_archived
    FROM public.items WHERE id = p_item_id FOR UPDATE;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_type NOT IN ('request', 'wish') THEN RAISE EXCEPTION 'Not a wish' USING ERRCODE = '22023'; END IF;
  IF v_status IN ('completed', 'archived') OR v_archived IS NOT NULL THEN
    RAISE EXCEPTION 'Wish is no longer active' USING ERRCODE = '22023';
  END IF;

  IF p_role = 'owner' THEN
    IF v_uid <> v_owner THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
    v_helper := p_helper_id;
  ELSIF p_role = 'helper' THEN
    IF p_helper_id IS NOT NULL AND p_helper_id <> v_uid THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
    v_helper := v_uid;
  ELSE
    RAISE EXCEPTION 'Invalid role' USING ERRCODE = '22023';
  END IF;

  UPDATE public.interests
     SET owner_confirmed_at = CASE WHEN p_role = 'owner' THEN coalesce(owner_confirmed_at, now()) ELSE owner_confirmed_at END,
         helper_confirmed_at = CASE WHEN p_role = 'helper' THEN coalesce(helper_confirmed_at, now()) ELSE helper_confirmed_at END
   WHERE item_id = p_item_id AND user_id = v_helper AND status = 'selected'
   RETURNING * INTO v_row;
  IF NOT FOUND THEN RAISE EXCEPTION 'Not a chosen helper on this wish' USING ERRCODE = '42501'; END IF;

  RETURN jsonb_build_object('owner_confirmed', v_row.owner_confirmed_at IS NOT NULL,
                            'helper_confirmed', v_row.helper_confirmed_at IS NOT NULL);
END;
$$;
REVOKE ALL ON FUNCTION public.confirm_wish_handoff(bigint, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.confirm_wish_handoff(bigint, uuid, text) TO authenticated;

-- Undo, like the pif: the wisher's undo clears both sides of that helper's handover; a helper
-- can undo their own confirmation only while the wisher hasn't confirmed.
CREATE OR REPLACE FUNCTION public.undo_wish_handoff(p_item_id bigint, p_helper_id uuid, p_role text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_owner uuid; v_status text;
  v_row public.interests;
  v_helper_was boolean;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT user_id, coalesce(pif_status, 'active') INTO v_owner, v_status
    FROM public.items WHERE id = p_item_id FOR UPDATE;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_status = 'completed' THEN RAISE EXCEPTION 'Cannot undo: wish already completed' USING ERRCODE = '22023'; END IF;

  IF p_role = 'owner' THEN
    IF v_uid <> v_owner THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
    SELECT * INTO v_row FROM public.interests WHERE item_id = p_item_id AND user_id = p_helper_id AND status = 'selected';
    IF NOT FOUND THEN RAISE EXCEPTION 'Not a chosen helper on this wish' USING ERRCODE = '42501'; END IF;
    v_helper_was := v_row.helper_confirmed_at IS NOT NULL;
    UPDATE public.interests SET owner_confirmed_at = NULL, helper_confirmed_at = NULL WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', true, 'role', 'owner', 'helper_was_confirmed', v_helper_was);
  ELSIF p_role = 'helper' THEN
    SELECT * INTO v_row FROM public.interests WHERE item_id = p_item_id AND user_id = v_uid AND status = 'selected';
    IF NOT FOUND THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
    IF v_row.owner_confirmed_at IS NOT NULL THEN RAISE EXCEPTION 'Cannot undo: wisher already confirmed' USING ERRCODE = '22023'; END IF;
    UPDATE public.interests SET helper_confirmed_at = NULL WHERE id = v_row.id;
    RETURN jsonb_build_object('ok', true, 'role', 'helper');
  END IF;
  RAISE EXCEPTION 'Invalid role' USING ERRCODE = '22023';
END;
$$;
REVOKE ALL ON FUNCTION public.undo_wish_handoff(bigint, uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.undo_wish_handoff(bigint, uuid, text) TO authenticated;

-- The wisher closes the wish. Every chosen helper is told in their chat and by a notification.
CREATE OR REPLACE FUNCTION public.complete_wish(p_item_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_owner uuid; v_type text; v_status text; v_archived timestamptz; v_title text;
  v_rec record; v_conv uuid;
BEGIN
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501'; END IF;
  SELECT user_id, lower(coalesce(item_type, 'offer')), coalesce(pif_status, 'active'), archived_at, title
    INTO v_owner, v_type, v_status, v_archived, v_title
    FROM public.items WHERE id = p_item_id FOR UPDATE;
  IF v_owner IS NULL THEN RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002'; END IF;
  IF v_uid <> v_owner THEN RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501'; END IF;
  IF v_type NOT IN ('request', 'wish') THEN RAISE EXCEPTION 'Not a wish' USING ERRCODE = '22023'; END IF;
  IF v_status IN ('completed', 'archived') OR v_archived IS NOT NULL THEN
    RAISE EXCEPTION 'Wish is no longer active' USING ERRCODE = '22023';
  END IF;

  UPDATE public.items
     SET pif_status = 'completed', completed_at = now(),
         piffer_confirmed_handoff = true,
         receiver_confirmed_receipt = EXISTS (SELECT 1 FROM public.interests
                                               WHERE item_id = p_item_id AND status = 'selected' AND helper_confirmed_at IS NOT NULL)
   WHERE id = p_item_id;

  FOR v_rec IN SELECT user_id FROM public.interests WHERE item_id = p_item_id AND status = 'selected' LOOP
    SELECT c.id INTO v_conv
      FROM public.conversations c
      JOIN public.conversation_participants cp1 ON cp1.conversation_id = c.id AND cp1.user_id = v_owner
      JOIN public.conversation_participants cp2 ON cp2.conversation_id = c.id AND cp2.user_id = v_rec.user_id
     WHERE c.item_id = p_item_id LIMIT 1;
    IF v_conv IS NOT NULL THEN
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message)
        VALUES (v_conv, v_owner, 'Önskan är uppfylld! Tack för att ni använde PIF. 🎉', true);
    END IF;
    PERFORM public.create_notification(
      p_user_id => v_rec.user_id,
      p_type    => 'wish_completed',
      p_payload => jsonb_build_object(
        'title', 'Önskan "' || v_title || '" är uppfylld. Tack för hjälpen!',
        'content', 'Önskaren har stängt önskan.',
        'action_url', CASE WHEN v_conv IS NOT NULL THEN '/messages?conversation=' || v_conv::text ELSE '/item/' || p_item_id::text END,
        'conversation_id', v_conv,
        'reference_id', p_item_id::text, 'reference_type', 'item',
        'item_id', p_item_id, 'item_title', v_title, 'actor_id', v_owner));
  END LOOP;
  RETURN true;
END;
$$;
REVOKE ALL ON FUNCTION public.complete_wish(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.complete_wish(bigint) TO authenticated;

-- ---------------------------------------------------------------------------------------------
-- Old entry points (same signatures; pif branch unchanged).
CREATE OR REPLACE FUNCTION public.confirm_pif_handoff(p_item_id bigint, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item record;
  v_helper uuid;
  v_n int;
begin
  select * into v_item from public.items where id = p_item_id for update;
  if v_item is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if coalesce(v_item.pif_status, 'active') in ('completed', 'archived') then
    raise exception 'Pif is no longer active' using errcode = '22023';
  end if;

  -- Wish: per-helper handover (confirm_wish_handoff); never completes the wish.
  if lower(coalesce(v_item.item_type, 'offer')) in ('request', 'wish') then
    if p_role = 'piffer' then
      select count(*), min(user_id::text)::uuid into v_n, v_helper
        from public.interests where item_id = p_item_id and status = 'selected';
      if v_n <> 1 then
        raise exception 'Several helpers are chosen: confirm per helper' using errcode = '22023';
      end if;
      perform public.confirm_wish_handoff(p_item_id, v_helper, 'owner');
    elsif p_role = 'receiver' then
      perform public.confirm_wish_handoff(p_item_id, null, 'helper');
    else
      raise exception 'Invalid role' using errcode = '22023';
    end if;
    return;
  end if;

  if p_role = 'piffer' then
    if v_item.user_id <> auth.uid() then
      raise exception 'Not authorized' using errcode = '42501';
    end if;
    if not exists (
      select 1 from public.interests
       where item_id = p_item_id and status = 'selected'
    ) then
      raise exception 'No receiver selected' using errcode = '22023';
    end if;
    update public.items
       set piffer_confirmed_handoff = true
     where id = p_item_id;
  elsif p_role = 'receiver' then
    if not exists (
      select 1 from public.interests
       where item_id = p_item_id and user_id = auth.uid() and status = 'selected'
    ) then
      raise exception 'Not authorized' using errcode = '42501';
    end if;
    update public.items
       set receiver_confirmed_receipt = true
     where id = p_item_id;
  else
    raise exception 'Invalid role' using errcode = '22023';
  end if;

  -- If both confirmed, mark as completed
  select * into v_item from public.items where id = p_item_id;
  if v_item.piffer_confirmed_handoff and v_item.receiver_confirmed_receipt then
    update public.items
       set pif_status = 'completed', completed_at = now()
     where id = p_item_id;
  end if;
end;
$function$;

CREATE OR REPLACE FUNCTION public.undo_pif_handoff_confirmation(p_item_id bigint, p_role text)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_item record;
  v_receiver_was_confirmed boolean;
  v_helper uuid;
  v_n int;
  v_res jsonb;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
  END IF;
  SELECT id, user_id, pif_status, item_type, piffer_confirmed_handoff, receiver_confirmed_receipt
  INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Item not found';
  END IF;
  IF v_item.pif_status = 'completed' THEN
    RAISE EXCEPTION 'Cannot undo: pif already completed';
  END IF;

  -- Wish: per-helper handover (undo_wish_handoff).
  IF lower(coalesce(v_item.item_type, 'offer')) IN ('request', 'wish') THEN
    IF p_role = 'piffer' THEN
      SELECT count(*), min(user_id::text)::uuid INTO v_n, v_helper
        FROM public.interests WHERE item_id = p_item_id AND status = 'selected';
      IF v_n <> 1 THEN
        RAISE EXCEPTION 'Several helpers are chosen: undo per helper' USING ERRCODE = '22023';
      END IF;
      v_res := public.undo_wish_handoff(p_item_id, v_helper, 'owner');
      RETURN json_build_object('ok', true, 'role', 'piffer',
                               'receiver_was_confirmed', coalesce((v_res->>'helper_was_confirmed')::boolean, false));
    ELSIF p_role = 'receiver' THEN
      PERFORM public.undo_wish_handoff(p_item_id, NULL, 'helper');
      RETURN json_build_object('ok', true, 'role', 'receiver');
    END IF;
    RAISE EXCEPTION 'Invalid role';
  END IF;

  IF p_role = 'piffer' THEN
    IF v_item.user_id IS DISTINCT FROM v_uid THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    v_receiver_was_confirmed := v_item.receiver_confirmed_receipt;
    UPDATE public.items
    SET piffer_confirmed_handoff = false,
        receiver_confirmed_receipt = false
    WHERE id = p_item_id;
    RETURN json_build_object(
      'ok', true,
      'role', 'piffer',
      'receiver_was_confirmed', v_receiver_was_confirmed
    );
  ELSIF p_role = 'receiver' THEN
    IF v_item.piffer_confirmed_handoff THEN
      RAISE EXCEPTION 'Cannot undo: piffer already confirmed';
    END IF;
    IF NOT EXISTS (
      SELECT 1 FROM public.interests
      WHERE item_id = p_item_id AND user_id = v_uid AND status = 'selected'
    ) THEN
      RAISE EXCEPTION 'Not authorized' USING ERRCODE = '42501';
    END IF;
    UPDATE public.items
    SET receiver_confirmed_receipt = false
    WHERE id = p_item_id;
    RETURN json_build_object('ok', true, 'role', 'receiver');
  ELSE
    RAISE EXCEPTION 'Invalid role';
  END IF;
END;
$function$;

-- ---------------------------------------------------------------------------------------------
-- Ratings follow the per-helper handover (pif branches unchanged).
CREATE OR REPLACE FUNCTION public.rate_after_handover(
  p_item_id bigint,
  p_rating smallint,
  p_comment text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_owner uuid;
  v_status text;
  v_is_wish boolean;
  v_interest public.interests;
  v_interest_id bigint;
  v_comment text := NULLIF(btrim(coalesce(p_comment, '')), '');
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;
  IF p_rating IS NULL OR p_rating < 1 OR p_rating > 5 THEN
    RAISE EXCEPTION 'Rating must be 1-5' USING ERRCODE = '22023';
  END IF;

  SELECT user_id, coalesce(pif_status, 'active'),
         lower(coalesce(item_type, 'offer')) IN ('request', 'wish')
    INTO v_owner, v_status, v_is_wish
    FROM public.items
   WHERE id = p_item_id;

  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;

  IF NOT v_is_wish THEN
    IF v_uid <> v_owner THEN
      RAISE EXCEPTION 'Only the piffer rates on a pif' USING ERRCODE = '42501';
    END IF;
    IF v_status <> 'completed' THEN
      RAISE EXCEPTION 'Pif is not completed yet' USING ERRCODE = '22023';
    END IF;
    SELECT i.id INTO v_interest_id
      FROM public.interests i
     WHERE i.item_id = p_item_id AND i.status = 'selected' AND i.user_id <> v_owner
     ORDER BY i.selected_at DESC NULLS LAST, i.created_at DESC
     LIMIT 1;
    IF v_interest_id IS NULL THEN
      RAISE EXCEPTION 'No receiver selected' USING ERRCODE = 'P0002';
    END IF;
    UPDATE public.interests
       SET receiver_rating = p_rating, rating_comment = v_comment
     WHERE id = v_interest_id;
    RETURN true;
  END IF;

  -- Wish: a chosen helper rates the wisher once their own handover is confirmed by both,
  -- or the wish is completed.
  IF v_uid = v_owner THEN
    RAISE EXCEPTION 'Wishers do not rate their helpers' USING ERRCODE = '42501';
  END IF;
  SELECT * INTO v_interest
    FROM public.interests i
   WHERE i.item_id = p_item_id AND i.user_id = v_uid AND i.status = 'selected'
   LIMIT 1;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a selected helper on this wish' USING ERRCODE = '42501';
  END IF;
  IF NOT (v_status = 'completed' OR (v_interest.owner_confirmed_at IS NOT NULL AND v_interest.helper_confirmed_at IS NOT NULL)) THEN
    RAISE EXCEPTION 'Wish is not fulfilled yet' USING ERRCODE = '22023';
  END IF;
  UPDATE public.interests
     SET owner_rating = p_rating, owner_rating_comment = v_comment
   WHERE id = v_interest.id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_pending_ratings(p_days integer DEFAULT 30)
RETURNS TABLE (item_id bigint, title text, is_wish boolean, ratee_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  -- Wishes I helped with (my handover confirmed by both, or the wish completed) and haven't
  -- rated the wisher on.
  SELECT it.id, it.title, true, it.user_id
    FROM public.interests i
    JOIN public.items it ON it.id = i.item_id
   WHERE i.user_id = (SELECT auth.uid())
     AND i.status = 'selected'
     AND i.owner_rating IS NULL
     AND it.item_type = 'request'
     AND it.user_id <> (SELECT auth.uid())
     AND (
       (it.pif_status = 'completed'
        AND it.completed_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90))))
       OR (coalesce(it.pif_status, 'active') NOT IN ('completed', 'archived')
           AND i.owner_confirmed_at IS NOT NULL AND i.helper_confirmed_at IS NOT NULL
           AND greatest(i.owner_confirmed_at, i.helper_confirmed_at) >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90))))
     )
  UNION ALL
  -- My pifs whose receiver I haven't rated (not those given away outside the app).
  SELECT it.id, it.title, false, i.user_id
    FROM public.items it
    JOIN public.interests i ON i.item_id = it.id
   WHERE it.user_id = (SELECT auth.uid())
     AND coalesce(it.item_type, 'offer') = 'offer'
     AND it.pif_status = 'completed'
     AND NOT coalesce(it.completed_outside_app, false)
     AND i.status = 'selected'
     AND i.receiver_rating IS NULL
     AND i.user_id <> it.user_id
     AND it.completed_at >= now() - make_interval(days => greatest(1, least(coalesce(p_days, 30), 90)));
$$;

CREATE OR REPLACE FUNCTION public.get_user_public_stats(p_user_id uuid)
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
  WITH received AS (
    -- As a pif's receiver, rated by the piffer.
    SELECT i.receiver_rating::numeric AS v
      FROM public.interests i
      JOIN public.items it ON it.id = i.item_id
     WHERE i.user_id = p_user_id AND i.receiver_rating > 0
       AND coalesce(it.item_type, 'offer') <> 'request'
    UNION ALL
    -- As a wisher, rated by a helper.
    SELECT i.owner_rating::numeric
      FROM public.interests i
      JOIN public.items it ON it.id = i.item_id
     WHERE it.user_id = p_user_id AND it.item_type = 'request' AND i.owner_rating > 0
  )
  SELECT jsonb_build_object(
    'pifs_given', (
      SELECT count(*) FROM public.items
      WHERE user_id = p_user_id AND item_type = 'offer' AND pif_status = 'completed'
    ),
    -- Wishes this person helped fulfil: the wisher confirmed their handover, or the wish was
    -- closed with no confirmations at all (then every chosen helper counts, as before).
    'wishes_fulfilled', (
      SELECT count(DISTINCT it.id)
      FROM public.interests i
      JOIN public.items it ON it.id = i.item_id
      WHERE i.user_id = p_user_id AND i.status = 'selected'
        AND it.item_type = 'request'
        AND (i.owner_confirmed_at IS NOT NULL
             OR (it.pif_status = 'completed' AND NOT EXISTS (
                   SELECT 1 FROM public.interests j
                    WHERE j.item_id = it.id AND j.status = 'selected' AND j.owner_confirmed_at IS NOT NULL)))
    ),
    'active_posts', (
      SELECT count(*) FROM public.items WHERE user_id = p_user_id AND NOT is_inactive
    ),
    'total_posts', (
      SELECT count(*) FROM public.items WHERE user_id = p_user_id
    ),
    'rating_avg', (SELECT round(avg(v), 2) FROM received),
    'rating_count', (SELECT count(*) FROM received)
  );
$function$;

-- Withdrawing / deselecting a wish helper clears that helper's handover (the row goes back to
-- the queue or is deleted by withdraw_pif / withdraw_receiver; a pending row must not keep a
-- confirmation if the helper is chosen again).
CREATE OR REPLACE FUNCTION public._interests_clear_handover_on_unselect()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF new.status IS DISTINCT FROM 'selected' THEN
    new.owner_confirmed_at := NULL;
    new.helper_confirmed_at := NULL;
  END IF;
  RETURN new;
END;
$$;
DROP TRIGGER IF EXISTS trg_interests_clear_handover_on_unselect ON public.interests;
CREATE TRIGGER trg_interests_clear_handover_on_unselect
  BEFORE UPDATE OF status ON public.interests
  FOR EACH ROW EXECUTE FUNCTION public._interests_clear_handover_on_unselect();
