# Backlog

## Wish conversation visibility (low priority, root cause unconfirmed)

Observed once on a heavily-retested wish conversation (`ebc1d925-…`, item 5) that went through an unusual sequence tonight: multiple completion attempts, rating-modal tests, force-complete experiments, and the participant/RLS/categorization investigation itself.

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
