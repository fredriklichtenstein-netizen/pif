## Root cause (confirmed by reading the live function)

The reselection-message guard `if v_was_closed and v_existing_messages > 0` never fires for the troubled conversation because `v_existing_messages` is computed with `coalesce(is_system_message, false) = false` — it counts only human messages. The troubled conversation contains exclusively system messages (initial selection notice + withdrawal notices), so the count is 0 and the reselection INSERT is skipped.

The intent of the guard is "has anything happened here before" (to distinguish a fresh insert from a reuse where we'd otherwise double-post initial-selection messages via `_insert_pif_system_messages`). System messages absolutely count for that purpose.

## Fix

Replace the broken `db/manual_migrations/select_wish_helper_reuse_logging.sql` with a corrected migration based on the **live** `pg_proc` body (joins through `conversation_participants`, calls `_insert_pif_system_messages`, uses `FOUND` for `v_was_closed`). The new migration applies two changes:

1. **Real fix:** Drop the `is_system_message` filter from the `v_existing_messages` count. Count all messages so the reuse+was-closed branch correctly identifies a previously-used conversation and posts the "valt på nytt" pair.
2. **Diagnostic logging:** Add `[swh-reuse-diag]` `RAISE NOTICE` lines at the same checkpoints planned before — lookup result, reuse-branch reopen (`v_was_closed`), message count, guard evaluation, and post-insert confirmation. Keep these in for one clean test pass; a follow-up cleanup migration strips them.

Everything else in the function body is preserved verbatim from the live `pg_proc` output.

## DROP + CREATE discipline

Per the rule established after the `withdraw_pif` overload incident:

```sql
drop function if exists public.select_wish_helper(bigint, uuid);
drop function if exists public.select_wish_helper(bigint, uuid, text);
create function public.select_wish_helper(...) ...
```

Then re-grant execute to `authenticated`.

## Side effect to call out

With the count fix, the very next re-selection on the troubled conversation **will** post the reselection pair. That's the desired behavior. No other call sites or UI need to change — `ConversationView`'s `closed_at` handling already updates via the `pif:conversation-refetch` event after the RPC returns, and the new system messages flow through the existing realtime channel.

## Files touched

1. `db/manual_migrations/select_wish_helper_reuse_logging.sql` — **overwrite** with the live-body-based version containing the count fix + diagnostic `RAISE NOTICE` lines.
2. No frontend changes this round. (Issue 1 — the missing `p_fulfiller_id` in `InterestSelectionList.handleWithdraw` — is already shipped in the previous turn.)

## Out of scope

- `_insert_pif_system_messages` stays untouched (its early-return guard prevents duplicate initial-selection notices on reuse, which is what we want now that the reselection branch in `select_wish_helper` does its own targeted INSERTs).
- No `ConversationView` changes.
