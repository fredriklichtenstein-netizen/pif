-- Manual migration — apply via Supabase SQL editor.
-- Adds an optional "how I can help" note to each interest row and a
-- helper RPC for wishes that allows multiple selected helpers without
-- flipping the others to "not_selected" (unlike select_receiver, which
-- enforces a single receiver for pifs).

alter table public.interests
  add column if not exists note text;

create or replace function public.select_wish_helper(
  p_item_id bigint,
  p_helper_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_owner_id uuid;
begin
  select user_id into v_owner_id from public.items where id = p_item_id;
  if v_owner_id is null then
    raise exception 'item not found' using errcode = 'P0002';
  end if;
  if v_owner_id <> auth.uid() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  update public.interests
     set status = 'selected',
         selected_at = coalesce(selected_at, now())
   where item_id = p_item_id
     and user_id = p_helper_id;

  select id into v_conversation_id
    from public.conversations
   where item_id = p_item_id
     and ((user1_id = v_owner_id and user2_id = p_helper_id)
       or (user1_id = p_helper_id and user2_id = v_owner_id))
   limit 1;

  if v_conversation_id is null then
    insert into public.conversations (item_id, user1_id, user2_id)
      values (p_item_id, v_owner_id, p_helper_id)
      returning id into v_conversation_id;
  end if;

  return v_conversation_id;
end;
$$;
