-- Manual migration: soft-delete messages + per-conversation unread + mark-read RPC.
-- Run in the Supabase SQL editor.

-- 1) Soft delete column on messages.
alter table public.messages
  add column if not exists deleted_at timestamptz;

-- 2) RPC: allow the sender to soft-delete their own message.
create or replace function public.delete_own_message(p_message_id bigint)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_sender uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select sender_id into v_sender from public.messages where id = p_message_id;
  if v_sender is null then
    return false;
  end if;
  if v_sender <> v_uid then
    raise exception 'Cannot delete another user''s message';
  end if;

  update public.messages
    set deleted_at = now(),
        content = ''
    where id = p_message_id;

  return true;
end;
$$;

grant execute on function public.delete_own_message(bigint) to authenticated;

-- 3) RPC: mark a conversation as read for the calling user (now()).
create or replace function public.mark_conversation_read(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  update public.conversation_participants
    set last_read_at = now()
    where conversation_id = p_conversation_id
      and user_id = v_uid;

  update public.messages
    set read_at = now()
    where conversation_id = p_conversation_id
      and sender_id <> v_uid
      and read_at is null;

  return true;
end;
$$;

grant execute on function public.mark_conversation_read(uuid) to authenticated;
