## Issue 1 — Second `withdraw_pif` call site missing `p_fulfiller_id`

File: `src/components/post/interactions/interest/InterestSelectionList.tsx`, in `handleWithdraw` (around line 648–690).

Currently:
```ts
const { error } = await (supabase.rpc as any)("withdraw_pif", {
  p_item_id: numericItemId,
  p_action: "reopen",
});
```

This is invoked from the owner's feed-card popup "Avmarkera" button (`onClick={() => setWithdrawId(r.id)}` at line 939). For wishes this hits the RPC's wish branch which now requires `p_fulfiller_id` (errcode 22023) and, when called without it, also risks affecting other fulfillers.

Fix:
1. Resolve the withdrawn row's `user_id` from `rows` using the existing `targetId` (which is `r.id`):
   ```ts
   const targetRow = rows.find((r) => r.id === targetId);
   const fulfillerId = targetRow?.user_id ?? null;
   ```
2. Pass `p_fulfiller_id` on the wish path only, mirroring `usePifCompletion`:
   ```ts
   const { error } = await (supabase.rpc as any)("withdraw_pif", {
     p_item_id: numericItemId,
     p_action: "reopen",
     p_fulfiller_id: isWish ? fulfillerId : null,
   });
   ```
3. Leave pif behaviour unchanged (offers ignore `p_fulfiller_id` server-side).
4. No copy or UI changes; the optimistic `setRows` block already handles the local update correctly.

## Issue 2 — Temporary diagnostic logging in `select_wish_helper`'s reuse branch

Create a new manual migration `db/manual_migrations/select_wish_helper_reuse_logging.sql` that re-declares the function (same signature/body as `select_wish_helper_resets_closed_at.sql`) with `RAISE NOTICE` statements added inside the reuse branch. We DROP+CREATE rather than CREATE OR REPLACE to avoid creating overload duplicates (per the rule established after the prior incident).

Logging points:
- After the conversation lookup: `RAISE NOTICE` with `v_conversation_id`, whether `v_conversation_id IS NULL` (insert path vs reuse path), `p_item_id`, `p_helper_id`, `v_owner_id`.
- Inside the `else` (reuse) branch, AFTER the `closed_at = null` UPDATE: log `v_reopen_count` and the resulting `v_was_closed`.
- After the message-count query: log `v_existing_messages` and `v_seed IS NOT NULL`.
- Right before the reselection-message `INSERT` block: log whether the guard `v_was_closed AND v_existing_messages > 0` evaluated true (i.e. whether the INSERTs are about to run).
- A final `RAISE NOTICE` after the INSERT block confirming "reselection messages posted" when it ran.

Tag every notice with a stable prefix like `[swh-reuse-diag]` so logs are greppable in Supabase logs.

Logging is temporary: a follow-up cleanup migration will strip the `RAISE NOTICE` lines once the next clean test sequence (withdraw → confirm closed in DB → reselect → verify) has been captured.

## Out of scope this round
- No further changes to `_insert_pif_system_messages` (its early-return guard is bypassed by `select_wish_helper`'s own targeted INSERTs, so it's not the source of the missing reselection messages).
- No changes to `ConversationView`'s `closed_at` handling — the DB/UI mismatch will be re-evaluated after the clean test pass.

## Files touched
1. `src/components/post/interactions/interest/InterestSelectionList.tsx` — fix `handleWithdraw` (frontend only).
2. `db/manual_migrations/select_wish_helper_reuse_logging.sql` — new file with `DROP FUNCTION` + `CREATE FUNCTION` carrying the diagnostic `RAISE NOTICE` lines; user runs it manually in Supabase SQL editor.
