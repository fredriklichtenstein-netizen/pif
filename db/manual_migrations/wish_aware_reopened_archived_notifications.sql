-- Apply manually on your Supabase project.
--
-- Trim duplicate notifications when a system message already covers the
-- event for that recipient. Pre-trim copy retained for:
--   * pif_archived (unconditional, every interested user)
--   * wish_archived whole-wish branch (p_selected_user_id IS NULL,
--     unconditional, every interested user)
-- These two paths do NOT post per-conversation system messages, so the
-- notification is the only signal.
--
-- Signature unchanged. DROP exact 4-arg signature explicitly.

drop function if exists public.notify_item_interest_event(bigint, text, uuid, boolean);

create function public.notify_item_interest_event(
  p_item_id bigint,
  p_event text,
  p_selected_user_id uuid default null,
  p_is_reselection boolean default false
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $function$
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
      -- TRIM: selected user already gets a system message in the conversation.
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        continue;
      else
        v_msg_title := 'En mottagare har valts för "' || v_title || '".';
        v_msg_content := 'Din intresseanmälan är sparad ifall piffen öppnas igen.';
      end if;

    elsif p_event = 'helper_selected' then
      -- TRIM: selected fulfiller already gets a system message in the conversation
      -- (including the reselection variant).
      if p_selected_user_id is not null and v_rec.user_id = p_selected_user_id then
        continue;
      else
        v_msg_title := 'Någon har valts till att uppfylla önskan "' || v_title || '".';
        v_msg_content := 'Ditt erbjudande är sparat ifall fler behövs.';
      end if;

    elsif p_event = 'pif_reopened' then
      -- TRIM: previously-selected receiver gets a system message via withdraw_pif.
      if v_rec.status = 'selected' or (p_selected_user_id is not null and v_rec.user_id = p_selected_user_id) then
        continue;
      else
        v_msg_title := 'Piffen "' || v_title || '" är tillgänglig igen!';
        v_msg_content := 'Du kan fortfarande hämta den.';
      end if;

    elsif p_event = 'wish_reopened' then
      -- TRIM (full): withdraw_pif reopen path posts a system message to the
      -- affected fulfiller. Non-selected interested users get nothing —
      -- the wish is multi-fulfiller so a wish-wide "available again" claim
      -- would be wrong.
      continue;

    elsif p_event = 'pif_archived' then
      -- KEEP unconditional (pre-trim): no per-conversation system message
      -- is posted on whole-item archive/delete, so the notification is the
      -- only signal for every interested user.
      v_msg_title := 'Piffen "' || v_title || '" har avslutats.';

    elsif p_event = 'wish_archived' then
      if p_selected_user_id is not null then
        -- TRIM (fully silenced): per-fulfiller withdraw-via-archive already
        -- posts a system message to the affected fulfiller's conversation,
        -- so this branch emits no notifications at all.
        continue;
      else
        -- KEEP unconditional (pre-trim) whole-wish archive/delete: no
        -- per-conversation system message is posted, so the notification
        -- is the only signal for every interested user.
        v_msg_title := 'Önskan "' || v_title || '" har avslutats av önskaren.';
        if v_rec.status = 'selected' then
          v_msg_content := 'Tack för att du erbjöd din hjälp.';
        else
          v_msg_content := 'Ditt erbjudande är sparat, men önskan är inte längre aktiv.';
        end if;
      end if;

    elsif p_event = 'pif_completed' then
      -- TRIM (fully silenced): selected receiver gets a system message on
      -- completion; non-selected interested users don't need a signal.
      continue;

    elsif p_event = 'wish_completed' then
      -- TRIM (fully silenced): selected fulfiller(s) get a system message
      -- on completion; non-selected interested users don't need a signal.
      continue;

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

  -- TRIM: owner self-notifications removed for pif_completed and wish_completed
  -- (the owner triggered the action and sees the in-app confirmation flow).
end;
$function$;

revoke all on function public.notify_item_interest_event(bigint, text, uuid, boolean) from public;
grant execute on function public.notify_item_interest_event(bigint, text, uuid, boolean) to authenticated;
