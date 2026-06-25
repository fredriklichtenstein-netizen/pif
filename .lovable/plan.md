## Background

Three follow-ups after the multi-fulfiller `withdraw_pif` fix on item 38:

1. The "Ångra val" confirmation dialog in `ConversationView.tsx` still offers a "Återöppna / Arkivera önskan" choice that implies the wish was closed by selecting one fulfiller (it wasn't).
2. After picking "Återöppna önskan", the page goes dead until refresh — classic Radix overlay stuck on body during a close → navigate race.
3. After withdrawal, the conversation still shows as open (input bar visible, three-dot still offers "Ångra val") even though `conversations.closed_at` is set in the DB — the frontend never reads `closed_at`, only `items.pif_status`, which is intentionally untouched for wishes.

(2) and (3) are not the same bug but they compound: a refetch alone fixes (3) and would also paper over part of (2), but the dead-UI is the dialog close → `navigate()` race, which needs its own small fix.

## Changes

### 1. `src/components/messaging/ConversationView.tsx` — withdraw dialog copy + flow (wish branch only)

Replace the current wish branch of the withdraw `AlertDialog` (lines 435–465) with a single-action confirmation. Keep the pif branch (`!isRequest`) byte-identical — reopen/archive choice still applies to offers because for a pif there is only ever one selected receiver and the item itself transitions back to open or to archived.

For wishes, render instead:

- Title: `Ångra val av {otherName} som uppfyllare`
- Description: `{otherName} är inte längre vald att uppfylla din önskan. Andra valda uppfyllare påverkas inte, och din önskan ligger kvar som den är.`
- Single primary action: `Ångra valet` → `handleWithdraw("reopen")` (server-side, "reopen" and "archive" do the same thing on a wish — delete the one interest and close the one conversation — but the `wish_reopened` notification fan-out is the right semantic vs `wish_archived`, and matches the system messages `usePifCompletion` already posts for the `reopen` branch on wishes).
- Cancel button unchanged.

No icon for the destructive variant — `Ångra valet` uses the default `AlertDialogAction` styling, not `bg-destructive`, since for wishes this isn't archiving anything.

### 2. `src/components/messaging/ConversationView.tsx` — `handleWithdraw` dead-UI fix

Current code (lines 248–255) closes the dialog synchronously and then awaits the RPC + posts system messages + dispatches notifications, then calls `onBack()` or `navigate("/messages")` immediately. On the wish path the dialog is still mid-unmount when navigation happens, and Radix's body `pointer-events: none` lock occasionally never gets cleared.

Fix:

- Move `setWithdrawOpen(false)` to AFTER the await, not before, so Radix unmount happens against a stable tree.
- Defer the post-success `onBack()` / `navigate()` by one tick (`setTimeout(..., 0)` or `requestAnimationFrame`) so the dialog's close transition + body-style cleanup runs first.
- If `res.ok` is true but the user is staying on the same conversation (wish case where the conversation is now closed but still useful to view as history), do NOT navigate away — just close the dialog and let the now-closed state render in place. For pifs, keep the existing navigate (the conversation closing is the end of that thread). Drive this by `isRequest`.

### 3. Treat conversation-level `closed_at` as authoritative for "is this thread closed"

Today `ConversationView`'s `isClosed` reads only `completion.pifStatus`. For wishes that's wrong after withdrawal: the item stays active, only the conversation closes.

- `src/types/messaging.ts`: add `closed_at?: string | null` to `Conversation`.
- `src/hooks/useConversationDetails.ts`: include `closed_at` in both transformed objects (the `Conversation` and the local copy used to derive `otherParticipant`). It's already selected by `select('*')` — just thread it through.
- `src/components/messaging/ConversationView.tsx`: derive

  ```ts
  const isClosed =
    !!conversation?.closed_at ||
    completion.pifStatus === "completed" ||
    completion.pifStatus === "archived";
  ```

  (Will need `useConversationDetails` to return `conversation` too; today it already does — just consume it.) This single change hides the message input, switches to the read-only footer, and removes "Ångra val" from the three-dot menu the moment `closed_at` is set, fixing #3.

### 4. Refetch conversation details after withdraw (closes #3 end-to-end)

Even with `closed_at` wired up, the frontend has stale `conversation` state right after `withdraw`. Two options; going with (a):

- (a) **Event-driven**: `usePifCompletion.withdraw` already dispatches nothing on success. Have it dispatch `pif:conversation-refetch` with `{ conversationId }` after the RPC succeeds. In `useConversationDetails`, listen for the event and re-run the fetch when the id matches. This matches the existing `pif:conversations-refresh` / `pif:conversation-read` pattern used by `useConversations`, no architectural change.

This also implicitly helps issue #2: once the read-only footer renders in place, we don't navigate away on wishes at all, so there's no close → navigate race left.

### 5. No DB / migration changes

`withdraw_pif` itself is correct. No new SQL.

## Out of scope / explicitly NOT touching

- Pif (offer) withdrawal dialog — unchanged, reopen/archive choice still applies.
- `withdraw_pif` SQL function — verified correct in last round.
- `wish_reopened` / `wish_archived` notification copy — already on the backlog, separate pass.
- The "page-wide dead UI" symptom on the pif (offer) path — not reported in this round; only the wish "Återöppna" path was observed dead. The deferred-navigate fix in §2 still benefits pifs as a defensive improvement, but no behavior change to pif copy or routing.

## Verification (post-build mode)

1. Wish with 2 fulfillers: open piffer's conversation with fulfiller A, three-dot → new single-action dialog → confirm. Conversation immediately shows read-only footer, input gone, three-dot no longer offers "Ångra val". No navigation away. Page remains interactive (no dead UI). Fulfiller B's conversation untouched.
2. Pif: dialog still shows reopen/archive choice, both still navigate back to `/messages`, page stays interactive.
3. Re-open the now-closed wish conversation from `/messages` history bucket — `closed_at` keeps it in read-only mode on re-mount.
