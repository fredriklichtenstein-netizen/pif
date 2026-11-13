-- Post lifecycle fixes (2026-11-14).
--
-- 1. items.is_inactive: archived/completed posts sort below active ones in
--    the feed (ORDER BY is_inactive, created_at DESC). Generated, so it can
--    never drift from pif_status/archived_at.
-- 2. No new likes, comments or comment likes on a completed/archived post
--    (interests already had this rule).
-- 3. The piffer can only confirm the handover, or complete with a rating,
--    while a receiver is selected -- withdraw_pif() resets the selection
--    but leaves the item 'active', and both paths used to accept that.
-- 4. mark_item_given_away(): the owner completes a pif/wish that was given
--    away or fulfilled outside the app (no receiver). Counts as completed;
--    items.completed_outside_app tells it apart.

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS is_inactive boolean
    GENERATED ALWAYS AS (
      coalesce(pif_status IN ('archived', 'completed'), false) OR archived_at IS NOT NULL
    ) STORED;

ALTER TABLE public.items
  ADD COLUMN IF NOT EXISTS completed_outside_app boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS items_feed_order_idx ON public.items (is_inactive, created_at DESC);

-- 2. Closed posts take no new likes/comments/comment likes.
CREATE OR REPLACE FUNCTION public.item_is_open(p_item_id bigint)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.items it
    WHERE it.id = p_item_id
      AND coalesce(it.pif_status, 'active') NOT IN ('archived', 'completed')
      AND it.archived_at IS NULL
  );
$$;

GRANT EXECUTE ON FUNCTION public.item_is_open(bigint) TO anon, authenticated;

DROP POLICY IF EXISTS "Auth insert" ON public.likes;
CREATE POLICY "Auth insert" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.item_is_open(item_id));

DROP POLICY IF EXISTS "Auth insert" ON public.comments;
CREATE POLICY "Auth insert" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()) AND public.item_is_open(item_id));

-- Two identical permissive insert policies existed; they OR together, so
-- both must carry the check. Replaced by one.
DROP POLICY IF EXISTS "Auth insert" ON public.comment_likes;
DROP POLICY IF EXISTS "comment_likes_insert_own" ON public.comment_likes;
CREATE POLICY "comment_likes_insert_own" ON public.comment_likes
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.comments c
      WHERE c.id = comment_likes.comment_id AND public.item_is_open(c.item_id)
    )
  );

-- 3a. The piffer confirms only while a receiver/helper is selected.
CREATE OR REPLACE FUNCTION public.confirm_pif_handoff(p_item_id bigint, p_role text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_item record;
  v_interest_id bigint;
begin
  select * into v_item from public.items where id = p_item_id for update;
  if v_item is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if coalesce(v_item.pif_status, 'active') in ('completed', 'archived') then
    raise exception 'Pif is no longer active' using errcode = '22023';
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
    select id into v_interest_id from public.interests
     where item_id = p_item_id and user_id = auth.uid() and status = 'selected'
     limit 1;
    if v_interest_id is null then
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

-- 3b. Complete-with-rating goes to the currently selected receiver, not to
--     whoever first joined a conversation (that could be one the piffer has
--     since deselected).
CREATE OR REPLACE FUNCTION public.complete_pif_with_rating(p_item_id bigint, p_rating smallint, p_comment text DEFAULT NULL::text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_piffer      uuid;
  v_status      text;
  v_receiver    uuid;
  v_interest_id bigint;
BEGIN
  SELECT user_id, pif_status INTO v_piffer, v_status
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_piffer IS NULL THEN
    RAISE EXCEPTION 'Item not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_piffer <> auth.uid() THEN
    RAISE EXCEPTION 'Not authorized to complete this pif'
      USING ERRCODE = '42501';
  END IF;
  IF coalesce(v_status, 'active') IN ('completed', 'archived') THEN
    RAISE EXCEPTION 'Pif is no longer active' USING ERRCODE = '22023';
  END IF;

  -- The selected receiver, preferring one the piffer has a conversation with.
  SELECT i.id, i.user_id INTO v_interest_id, v_receiver
  FROM public.interests i
  WHERE i.item_id = p_item_id
    AND i.status = 'selected'
    AND i.user_id <> v_piffer
  ORDER BY EXISTS (
             SELECT 1 FROM public.conversation_participants cp
             JOIN public.conversations c ON c.id = cp.conversation_id
             WHERE c.item_id = p_item_id AND cp.user_id = i.user_id
           ) DESC,
           i.selected_at DESC NULLS LAST,
           i.created_at DESC
  LIMIT 1;

  IF v_receiver IS NULL THEN
    RAISE EXCEPTION 'No receiver selected' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.interests
     SET receiver_rating = p_rating,
         rating_comment  = NULLIF(btrim(p_comment), '')
   WHERE id = v_interest_id;

  UPDATE public.items
     SET pif_status                 = 'completed',
         piffer_confirmed_handoff   = true,
         receiver_confirmed_receipt = true,
         piffer_overruled           = true,
         completed_at               = now()
   WHERE id = p_item_id;
END;
$function$;

-- 4. Given away / fulfilled outside the app. Mirrors archive_item(): open
--    conversations are closed with a note to the other party, then the item
--    is completed with no receiver.
CREATE OR REPLACE FUNCTION public.mark_item_given_away(p_item_id bigint)
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_caller uuid := auth.uid();
  v_owner uuid; v_item_type text; v_title text; v_status text; v_archived_at timestamptz;
  v_is_wish boolean;
  v_conv record;
  v_other uuid;
  v_msg_other text; v_msg_owner text;
  v_notif_title text; v_notif_content text;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated' USING ERRCODE = '42501';
  END IF;

  SELECT user_id, coalesce(item_type, 'offer'), title, pif_status, archived_at
    INTO v_owner, v_item_type, v_title, v_status, v_archived_at
    FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_owner IS NULL THEN RETURN false; END IF;
  IF v_owner <> v_caller THEN
    RAISE EXCEPTION 'Only the owner can complete this item' USING ERRCODE = '42501';
  END IF;
  IF coalesce(v_status, 'active') IN ('completed', 'archived') OR v_archived_at IS NOT NULL THEN
    RAISE EXCEPTION 'Item is no longer active' USING ERRCODE = '22023';
  END IF;

  v_is_wish := lower(v_item_type) IN ('request', 'wish');

  FOR v_conv IN
    SELECT c.id FROM public.conversations c
    WHERE c.item_id = p_item_id AND c.closed_at IS NULL
  LOOP
    SELECT cp.user_id INTO v_other
      FROM public.conversation_participants cp
      WHERE cp.conversation_id = v_conv.id AND cp.user_id <> v_owner
      LIMIT 1;

    IF v_other IS NOT NULL THEN
      IF v_is_wish THEN
        v_msg_other := 'Önskaren har fått önskan "' || v_title || '" uppfylld på annat sätt. Konversationen är avslutad.';
        v_msg_owner := 'Du har markerat önskan som uppfylld. Hjälparen har informerats.';
        v_notif_title := 'Önskan "' || v_title || '" har uppfyllts på annat sätt.';
        v_notif_content := 'Konversationen är avslutad. Tack för att du ville hjälpa!';
      ELSE
        v_msg_other := 'Piffaren har gett bort "' || v_title || '" på annat sätt. Konversationen är avslutad.';
        v_msg_owner := 'Du har markerat piffen som piffad. Mottagaren har informerats.';
        v_notif_title := 'Piffen "' || v_title || '" har getts bort på annat sätt.';
        v_notif_content := 'Konversationen är avslutad och piffen är inte längre tillgänglig.';
      END IF;

      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conv.id, v_owner, v_msg_other, true, v_other);
      INSERT INTO public.messages (conversation_id, sender_id, content, is_system_message, target_user_id)
        VALUES (v_conv.id, v_owner, v_msg_owner, true, v_owner);

      PERFORM public.create_notification(
        p_user_id => v_other,
        p_type    => 'item_given_away',
        p_payload => jsonb_build_object(
          'title', v_notif_title,
          'content', v_notif_content,
          'reference_id', p_item_id::text,
          'reference_type', 'item',
          'action_url', '/item/' || p_item_id::text,
          'item_id', p_item_id,
          'item_title', v_title,
          'actor_id', v_owner
        )
      );
    END IF;

    UPDATE public.conversations
      SET closed_at = now(), closed_reason = 'owner_given_away'
      WHERE id = v_conv.id AND closed_at IS NULL;
  END LOOP;

  UPDATE public.items
    SET pif_status = 'completed',
        completed_at = now(),
        completed_outside_app = true,
        piffer_confirmed_handoff = true
    WHERE id = p_item_id AND user_id = v_caller;

  RETURN FOUND;
END;
$function$;

REVOKE ALL ON FUNCTION public.mark_item_given_away(bigint) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mark_item_given_away(bigint) TO authenticated;
