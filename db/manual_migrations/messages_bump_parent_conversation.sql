-- Issue A: keep conversations.updated_at and last_message_text in sync with
-- inserts into public.messages. Verified via pg_trigger that no such trigger
-- exists today — conversations.updated_at has been frozen at created_at since
-- row creation, making reopened/reused conversations look like stale history
-- in the Aktiva/Historik split.
--
-- Policy (confirmed with user):
--   * updated_at  : always bumped to NEW.created_at for ANY message insert
--                   (broadcast OR per-recipient OR system). Sort/recency.
--   * last_message_text : populated ONLY for broadcast (target_user_id IS NULL),
--                         non-system, non-soft-deleted messages. Per-recipient
--                         system messages (e.g. selection variants that differ
--                         per side) must never leak into the shared preview
--                         column that both participants see.
--   * No truncation (matches current client read of the raw column).
--   * No backfill (cosmetic; self-heals on next message).

create or replace function public._bump_conversation_on_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.conversations c
  set
    updated_at = new.created_at,
    last_message_text = case
      when new.target_user_id is null
        and coalesce(new.is_system_message, false) = false
        and new.deleted_at is null
        and new.content is not null
        and length(btrim(new.content)) > 0
      then new.content
      else c.last_message_text
    end
  where c.id = new.conversation_id;
  return null;
end;
$$;

drop trigger if exists trg_bump_conversation_on_message on public.messages;

create trigger trg_bump_conversation_on_message
after insert on public.messages
for each row
execute function public._bump_conversation_on_message();
