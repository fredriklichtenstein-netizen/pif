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

## Wish conversation visibility (low priority, root cause unconfirmed)

Observed once on a heavily-retested wish conversation (`ebc1d925-…`, item 5) that went through an unusual sequence: multiple completion attempts, rating-modal tests, force-complete experiments, and the participant/RLS/categorization investigation itself.

- Not reproducible on fresh wishes or fresh pifs — full end-to-end flows work cleanly for both.
- DB-level checks all came back consistent: RLS policy on `conversations` is type-agnostic, `get_user_conversation_ids` returns the id, and the PostgREST select with item embed returns the row with `pif_status='active'`, `item_type='request'`, owner resolved.
- Per `ConversationList.tsx`'s strict binary split on `isHistoricStatus(item.status)`, a conv with `status='active'` should land in Aktiva — yet it was reported invisible in both buckets, which implies the row never reached the `conversations` prop. Upstream cause not confirmed.

Five `console.debug` lines intentionally left in place for future diagnosis if it recurs:
- `src/components/notifications/NotificationList.tsx` — `[notif-render]`, `[notif-cta]`
- `src/pages/Messages.tsx` — `[messages] *` (deep-link effect + tab handlers)
- `src/hooks/useConversations.ts` — `[useConversations] setConversations` with `idsFromRpc` / `idsFromSelect` / `finalIds`
- `src/components/messaging/ConversationList.tsx` — `[ConversationList] bucket split` with `activeIds` / `historyIds`

If it recurs, the transcript of those four log groups should pinpoint the stage where the row is dropped.

## PIF notification deep-link (resolved)

Dedupe-ref logic fix confirmed working end-to-end on fresh pifs. No further action.

## WebSocket disconnect on Anne-Fred login (non-blocking)

Consistently observed at login for Anne-Fred's account. No user-facing impact reported so far. Likely a Supabase Realtime channel/auth race; investigate when convenient.
