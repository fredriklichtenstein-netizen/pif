# Backlog

## 🚨 PRIORITY BUG — `withdraw_pif` RPC corrupts multi-fulfiller wishes

Confirmed via direct DB source inspection. The `withdraw_pif` RPC has **no `item_type` branch** and unconditionally performs three destructive actions for the given item, regardless of whether it's a pif or a wish:

1. `DELETE` every `interests` row with `status = 'selected'` for the item — not just the specific fulfiller being withdrawn.
2. Resets every `not_selected` interest back to `pending`.
3. Closes the conversation for the item entirely.

For pifs this is correct (one receiver at a time). For wishes — which the product design supports having multiple simultaneous fulfillers — calling `withdraw_pif` for any single fulfiller's withdrawal will silently:

- destroy **every** other fulfiller's `selected` interest on the same wish,
- reset every other interested user's interest state, and
- close the associated conversations for those other valid fulfillers.

This is a real correctness / data-integrity bug, not a copy / wording issue.

**Required fix scope:** the wish branch of `withdraw_pif` must be scoped to the **specific fulfiller's `user_id`** being withdrawn:

- delete only that fulfiller's `selected` interests row,
- leave all other fulfillers' interests untouched,
- close only that fulfiller's conversation (not other fulfillers' conversations),
- leave the wish item itself active (other fulfillers still have valid selections).

The pif branch may keep its current single-receiver behavior. Treat this as a priority bug fix, not a polish item.

## Follow-up — DB notification builder still uses "hjälpare" + reopen framing

`db/manual_migrations/interest_status_change_notifications.sql` still emits:

- the noun "hjälpare" (around lines 93, 97) — should be migrated to drop "hjälpare" entirely (use phrasing like "den som ska uppfylla önskan", consistent with the front-end copy pass);
- "öppen igen" / reopening framing for `wish_reopened` (around lines 109–115), which only makes sense once the `withdraw_pif` multi-fulfiller fix above is in place. Until then this string asserts a state transition that doesn't reliably happen.

Schedule this migration as a follow-up to the `withdraw_pif` fix so wording and behaviour land consistently.

## Wish conversation visibility — REOPENED (active)

Reproduced on a fresh wish (item 32, conv `3aa088dd-31da-415a-88aa-5301d1d2c2ed`) opened via notification deep-link. The conversation was missing from the first `[ConversationList] bucket split` log (pre-deep-link mount), but the user confirmed via direct DB inspection that the server-side path is clean:

- `get_user_conversation_ids` (run under the affected user's JWT) DOES return `3aa088dd…`.
- RLS on `conversations` is type-agnostic and correct.
- `select_wish_helper` and `select_receiver` both insert into `conversation_participants` directly (no schema drift between participant columns — the earlier migration-file theory was based on stale `db/manual_migrations/*` content and is RETRACTED).

Current working theory: client-side race. `useConversations` mounted before Realtime delivered the just-created `conversation_participants` insert (or the event was dropped), and there was no retry trigger to reconcile after.

Mitigations landed in this pass (`src/hooks/useConversations.ts`):
- refetch on `window` focus and `document` visibilitychange,
- refetch on `pif:conversation-read` (fires immediately after notification deep-link opens the target conversation),
- refetch on `pif:conversations-refresh` custom event,
- expose `refreshConversations()` callback,
- `Messages.tsx` deep-link effect now calls `refreshConversations()` when the deep-linked item id has no match in the current list (instead of silently doing nothing).

If recurrence is still observed after these mitigations, the next suspect is a missed `conversation_participants` Realtime INSERT event on the channel itself (not a UI bug). Diagnostic logs left in place:
- `src/components/notifications/NotificationList.tsx` — `[notif-render]`, `[notif-cta]`
- `src/pages/Messages.tsx` — `[messages] *`
- `src/hooks/useConversations.ts` — `[useConversations] setConversations` with `idsFromRpc` / `idsFromSelect` / `finalIds`
- `src/components/messaging/ConversationList.tsx` — `[ConversationList] bucket split`

## Follow-up — wish-aware `_insert_pif_system_messages` migration (pending review)

Live function body confirmed (pulled from `pg_proc`). It hardcodes pif-only Swedish strings (`Du har valts som mottagare för…`, `Du har valt en mottagare för…`, plus pickup detail lines referencing "Piffaren") for both pifs and wishes. Migration to be drafted that:
- adds `item_type` to the existing `SELECT FROM items`,
- branches `v_receiver_msg` / `v_piffer_msg` on item_type,
- skips the pickup/handover detail block entirely for wishes (no analogous concept on the request side),
- preserves current pif behaviour byte-for-byte.

Will be posted for review before running.

## Follow-up — `notify_item_interest_event` actor-exclusion (pending live source)

Earlier round reported the actor receiving a `helper_selected` notification intended for the other party. Suspected root cause: the RPC's fan-out lacks an actor-exclusion clause. Needs the LIVE function definition pulled from `pg_proc` before writing a fix.



## PIF notification deep-link (resolved)

Dedupe-ref logic fix confirmed working end-to-end on fresh pifs. No further action.

## WebSocket disconnect on Anne-Fred login (non-blocking)

Consistently observed at login for Anne-Fred's account. No user-facing impact reported so far. Likely a Supabase Realtime channel/auth race; investigate when convenient.
