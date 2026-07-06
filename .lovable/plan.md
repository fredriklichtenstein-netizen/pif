## Root cause

`markAllConversationsAsRead` filters by `c.unread_count > 0`, but the `unread_count` field on `Conversation` is never populated by the fetch in `useConversations` (grep confirms it's only ever written to `0`, never read from the DB). So `ids` is always `[]` and the function returns at line 318 before firing any RPC — matching the HAR showing zero `mark_conversation_read` calls.

The button's visibility, meanwhile, is gated by `unreadMessagesCount` from a different hook (`useUnreadMessagesCount`), which computes unread state directly from message rows. That hook also exposes `unreadByConversation` (a `{ [conversationId]: count }` map) — already imported and used in `Messages.tsx`. That's the authoritative source.

## Fix

Change `markAllConversationsAsRead` to accept the list of conversation IDs to mark, and have `Messages.tsx` pass the unread IDs derived from `unreadByConversation`.

### `src/hooks/useConversations.ts` (lines 308–318)

Replace the current signature and the broken filter:

```ts
const markAllConversationsAsRead = async (targetIds?: string[]) => {
  if (DEMO_MODE) {
    setConversations((prev) => prev.map((c) => ({ ...c, unread_count: 0 })));
    window.dispatchEvent(new CustomEvent('pif:messages:read-sync', { detail: { all: true } }));
    return;
  }
  if (!user) return;

  const ids =
    targetIds && targetIds.length > 0
      ? Array.from(new Set(targetIds.map(String)))
      : conversations.map((c) => String(c.id)); // fallback: all conversations

  if (ids.length === 0) return;
  // ... rest of function unchanged (optimistic clear, Promise.allSettled RPC loop,
  //     per-call error logging, pif:conversation-read events, reconcile on failure)
};
```

Rationale for the fallback: the RPC is idempotent and SECURITY DEFINER-scoped to the caller, so marking a conversation with no unread messages is a cheap no-op. That guarantees the button always does *something* even if `unreadByConversation` hasn't hydrated yet.

### `src/pages/Messages.tsx` (line ~259)

Pass the unread IDs from `unreadByConversation`:

```tsx
onClick={() => {
  const ids = Object.entries(unreadByConversation)
    .filter(([, n]) => (n ?? 0) > 0)
    .map(([cid]) => cid);
  void markAllConversationsAsRead(ids);
}}
```

## Out of scope

- No change to `useUnreadMessagesCount`, RLS, migrations, notifications sort, or i18n.
- Not fixing `unread_count` population in `useConversations` fetch — that's a separate cleanup and not required to unblock this button.

## Verification

1. Build passes.
2. In the running app: with unread conversations, click "Markera alla som lästa" → HAR shows one `mark_conversation_read` RPC call per unread conversation, badge stays at 0, no console errors.
