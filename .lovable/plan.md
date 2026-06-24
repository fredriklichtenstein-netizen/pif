## Scope

Lightweight bookkeeping only — no behavioural changes.

## Steps

1. **Keep all five debug logs in place.** No edits to:
   - `src/components/notifications/NotificationList.tsx` (`[notif-render]`, `[notif-cta]`)
   - `src/pages/Messages.tsx` (`[messages] *`)
   - `src/hooks/useConversations.ts` (`[useConversations] setConversations`)
   - `src/components/messaging/ConversationList.tsx` (`[ConversationList] bucket split`)

2. **Update `.lovable/plan.md` backlog** with two entries:
   - **Wish conversation visibility (low priority, unconfirmed root cause)** — observed once on heavily-retested wish `ebc1d925-…` (item 5). Fresh wishes + fresh pifs both work end-to-end. Five `console.debug` lines intentionally left in place across `NotificationList`, `Messages`, `useConversations`, `ConversationList` for future diagnosis if it recurs. PIF notification dedupe-ref fix is confirmed resolved.
   - **WebSocket disconnect on Anne-Fred login (non-blocking)** — consistently observed at login for that account, no user-facing impact reported. Investigate when convenient; likely Supabase Realtime channel/auth race.

3. **No code, schema, or query changes.** No cleanup of logs. No further investigation this turn.

## Out of scope

- Removing the debug logs (explicitly deferred).
- Any fix attempt for the wish visibility symptom (no confirmed root cause; not reproducible on fresh items).
- Anne-Fred WebSocket investigation (logged for later).
