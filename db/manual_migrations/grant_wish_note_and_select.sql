-- Manual migration — apply via Supabase SQL editor.
-- Adds an optional "how I can help" note to each interest row and a
-- helper RPC for wishes that allows multiple selected helpers without
-- flipping the others to "not_selected" (unlike select_receiver, which
-- enforces a single receiver for pifs).
--
-- The RPC is fully idempotent:
--   * Re-selecting the same helper does NOT change selected_at.
--   * The conversation between the wisher and the helper for this
--     item is reused if it already exists (never duplicated).
--   * The seeded "how I can help" first message is inserted only when
--     the conversation has zero messages — re-running the RPC with the
--     same arguments will never produce a duplicate seed message.

alter table public.interests
  add column if not exists note text;

-- Defence-in-depth uniqueness so concurrent grants from the same
-- helper can never produce two pending interest rows. The
-- application-side upsert already targets this conflict key.
create unique index if not exists interests_unique_user_item
  on public.interests (user_id, item_id);

-- Conversations between the same wisher+helper for the same item
-- must be unique regardless of which side initiated. Two concurrent
-- "Choose this helper" clicks could otherwise each insert one before
-- either commits — this index makes that race a hard error the RPC
-- can recover from by re-reading the surviving row.
create unique index if not exists conversations_unique_pair_per_item
  on public.conversations (
    item_id,
    least(user1_id, user2_id),
    greatest(user1_id, user2_id)
  );

create or replace function public.select_wish_helper(
  p_item_id bigint,
  p_helper_id uuid,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conversation_id uuid;
  v_owner_id uuid;
  v_existing_messages int;
  v_seed text;
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

  -- Reuse the existing conversation if one already exists for this
  -- (item, owner, helper) triple — never create a duplicate.
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

  -- Seed the helper's note as the first message, but only when the
  -- conversation has no messages yet. Without this guard, repeated
  -- calls would stack identical seed messages.
  v_seed := coalesce(
    nullif(btrim(p_note), ''),
    (select btrim(note) from public.interests
       where item_id = p_item_id and user_id = p_helper_id
         and note is not null and btrim(note) <> ''
       limit 1)
  );

  if v_seed is not null then
    select count(*) into v_existing_messages
      from public.messages
     where conversation_id = v_conversation_id;

    if v_existing_messages = 0 then
      insert into public.messages (conversation_id, sender_id, content)
        values (v_conversation_id, p_helper_id, v_seed);
    end if;
  end if;

  return v_conversation_id;
end;
$$;

revoke all on function public.select_wish_helper(bigint, uuid, text) from public;
grant execute on function public.select_wish_helper(bigint, uuid, text) to authenticated;
