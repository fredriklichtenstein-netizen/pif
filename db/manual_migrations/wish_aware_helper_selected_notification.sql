-- Apply manually on your Supabase project.
--
-- Wish-aware copy for the `helper_selected` branch of
-- public.notify_item_interest_event.
--
-- Only the `helper_selected` branch is changed. Every other branch
-- (receiver_selected, pif_reopened, wish_reopened, pif_archived,
-- wish_archived, pif_completed, wish_completed, and the piffer/wisher
-- self-notifications at the bottom) is preserved byte-for-byte
-- against the currently-live function pulled from pg_proc.
--
-- Wording rationale (matches the multi-fulfiller-neutral standard
-- established in _insert_pif_system_messages):
--   * Selected fulfiller: "Önskaren vill gärna att du uppfyller önskan..."
--     (avoids the "hjälpare/mottagare" pif terminology entirely)
--   * Other interested users: "Någon har valts till att uppfylla önskan..."
--     (does not imply the wish is closed — other fulfillers can still be picked)
--
-- BACKLOG: wish_reopened / wish_archived / wish_completed branches in
-- this same function still use single-fulfiller framing and should be
-- reviewed AFTER the withdraw_pif multi-fulfiller scoping fix lands.
-- Re-wording them before the underlying state-transition is corrected
-- would be premature. Do NOT touch those branches in this migration.

create or replace function public.notify_item_interest_event(
  p_item_id bigint,
  p_event text,
  p_selected_user_id uuid default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_caller uuid := auth.uid();
  v_owner uuid;
  v_title text;
  v_type text;
  v_is_request boolean;
  v_rec record;
  v_payload jsonb;
  v_msg_title text;
  v_msg_content text;
  v_action_url text;
  v_notif_type text;
begin
  if v_caller is null then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  select user_id, title, coalesce(item_type, 'offer')
    into v_owner, v_title, v_type
  from public.items
  where id = p_item_id;

  if v_owner is null then
    raise exception 'Item not found' using errcode = 'P0002';
  end if;
  if v_owner <> v_caller then
    raise exception 'Not authorized' using errcode = '42501';
  end if;

  v_is_request := lower(v_type) in ('request', 'wish');

  for v_rec in
    select user_id, status
    from public.interests
    where item_id = p_item_id
      and user_id <> v_owner
      and (status is null or status <> 'not_selected')
  loop
    v_msg_title := null;
    v_msg_content := null;
    v_action_url := '/item/' || p_item_id::text;
    v_notif_type := p_event;

    if p_event = 'receiver_selected' then
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        v_msg_title := 'Du har valts som mottagare för "' || v_title || '"!';
        v_msg_content := 'Öppna konversationen för att koordinera hämtning.';
        v_action_url := '/messages?item=' || p_item_id::text;
      else
        v_msg_title := 'En mottagare har valts för "' || v_title || '".';
        v_msg_content := 'Din intresseanmälan är sparad ifall piffen öppnas igen.';
      end if;

    elsif p_event = 'helper_selected' then
      -- Wish-aware, multi-fulfiller-neutral copy (changed in this migration).
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        v_msg_title := 'Önskaren vill gärna att du uppfyller önskan "' || v_title || '".';
        v_msg_content := 'Öppna konversationen för att samordna.';
        v_action_url := '/messages?item=' || p_item_id::text;
      else
        v_msg_title := 'Någon har valts till att uppfylla önskan "' || v_title || '".';
        v_msg_content := 'Ditt erbjudande är sparat ifall fler behövs.';
      end if;

    elsif p_event = 'pif_reopened' then
      if v_rec.status = 'selected' or (p_selected_user_id is not null and v_rec.user_id = p_selected_user_id) then
        v_msg_title := 'Piffaren har ångrat sig. Piffen "' || v_title || '" är nu öppen igen.';
      else
        v_msg_title := 'Piffen "' || v_title || '" är tillgänglig igen!';
        v_msg_content := 'Du kan fortfarande hämta den.';
      end if;

    elsif p_event = 'wish_reopened' then
      if v_rec.status = 'selected' or (p_selected_user_id is not null and v_rec.user_id = p_selected_user_id) then
        v_msg_title := 'Önskningen "' || v_title || '" är nu öppen igen.';
      else
        v_msg_title := 'Önskningen "' || v_title || '" är tillgänglig igen!';
        v_msg_content := 'Du kan fortfarande erbjuda din hjälp.';
      end if;

    elsif p_event = 'pif_archived' then
      v_msg_title := 'Piffen "' || v_title || '" har avslutats.';

    elsif p_event = 'wish_archived' then
      v_msg_title := 'Önskningen "' || v_title || '" har avslutats.';

    elsif p_event = 'pif_completed' then
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        v_msg_title := 'Piffen "' || v_title || '" är genomförd!';
        v_msg_content := 'Tack för att du tog emot.';
      else
        continue;
      end if;

    elsif p_event = 'wish_completed' then
      if p_selected_user_id is null or v_rec.user_id = p_selected_user_id or v_rec.status = 'selected' then
        v_msg_title := 'Önskningen "' || v_title || '" är uppfylld!';
        v_msg_content := 'Tack för din hjälp.';
      else
        continue;
      end if;
    else
      raise exception 'Unknown event: %', p_event;
    end if;

    if v_msg_title is null then
      continue;
    end if;

    v_payload := jsonb_build_object(
      'title', v_msg_title,
      'content', v_msg_content,
      'reference_id', p_item_id::text,
      'reference_type', 'item',
      'action_url', v_action_url,
      'item_id', p_item_id,
      'item_title', v_title,
      'actor_id', v_owner
    );

    perform public.create_notification(
      p_user_id => v_rec.user_id,
      p_type    => v_notif_type,
      p_payload => v_payload
    );
  end loop;

  if p_event = 'pif_completed' then
    perform public.create_notification(
      p_user_id => v_owner,
      p_type    => 'pif_completed',
      p_payload => jsonb_build_object(
        'title', 'Piffen "' || v_title || '" är genomförd!',
        'content', 'Bra jobbat.',
        'reference_id', p_item_id::text,
        'reference_type', 'item',
        'action_url', '/item/' || p_item_id::text,
        'item_id', p_item_id,
        'item_title', v_title
      )
    );
  elsif p_event = 'wish_completed' then
    perform public.create_notification(
      p_user_id => v_owner,
      p_type    => 'wish_completed',
      p_payload => jsonb_build_object(
        'title', 'Din önskning "' || v_title || '" är uppfylld!',
        'reference_id', p_item_id::text,
        'reference_type', 'item',
        'action_url', '/item/' || p_item_id::text,
        'item_id', p_item_id,
        'item_title', v_title
      )
    );
  end if;
end;
$$;

revoke all on function public.notify_item_interest_event(bigint, text, uuid) from public;
grant execute on function public.notify_item_interest_event(bigint, text, uuid) to authenticated;
