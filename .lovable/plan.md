## Root cause found

The unread badges are using two separate systems:

1. **Nav badge / Meddelanden tab counter — working**
   - Source: `useUnreadMessagesCount`
   - Flow: fetches the current user's conversation IDs, then fetches fresh `conversation_participants.last_read_at` directly from the DB, then counts unread messages.
   - This explains why it correctly shows `{ total: 0 }` after conversations are opened.

2. **Conversation-list per-conversation badges — broken**
   - Source: `ConversationList` reads `conversation.unread_count`.
   - `conversation.unread_count` is computed inside `useConversations`.
   - `useConversations` fetches participants via `get_conversation_participants`.
   - The existing RPC only returns `conversation_id` and `user_id`, not `last_read_at`.
   - Therefore `myParticipant.last_read_at` is missing on page load, the code falls back to `0`, and old messages are counted as unread again.
   - Opening a conversation only clears that badge locally via `pif:conversation-read`, so the bad count returns after refresh.

## Fix plan

1. **Make `useUnreadMessagesCount` the single source of truth**
   - Extend it to return both:
     - `unreadMessagesCount` for the nav/tab total
     - `unreadByConversation` for per-conversation badges
   - Keep the current DB-first sequence that is already working:
     1. fetch conversation IDs
     2. fetch fresh `last_read_at` from `conversation_participants`
     3. fetch messages
     4. calculate unread counts

2. **Stop per-conversation unread calculation in `useConversations`**
   - Remove the duplicate unread calculation from `useConversations`.
   - Keep `useConversations` focused on conversation metadata, participants, item status, and preview text.
   - Do not rely on `get_conversation_participants` for unread state.

3. **Wire the fresh unread map into the UI**
   - In `Messages.tsx`, read `unreadByConversation` from `useUnreadMessagesCount`.
   - Pass it to `ConversationList`.
   - In `ConversationList`, display `unreadByConversation[conversation.id] ?? 0` instead of `conversation.unread_count`.

4. **Keep realtime updates unified**
   - Existing realtime events in `useUnreadMessagesCount` already recompute from scratch on message and participant changes.
   - Since all badges will read from the same hook, the nav badge and per-conversation badges will update together and cannot diverge.

5. **Remove temporary debug noise**
   - Remove the temporary `console.log` unread breakdown logs from production code.
   - Keep only `console.error` for failed DB/RPC operations, consistent with the project logging rule.

## Files to change

- `src/hooks/useUnreadMessagesCount.ts`
- `src/hooks/useConversations.ts`
- `src/pages/Messages.tsx`
- `src/components/messaging/ConversationList.tsx`

## Expected result

After refresh, if the DB has current `last_read_at` values and the total unread count is `0`, all per-conversation badges will also stay cleared because they will use the same fresh DB-backed calculation as the working nav badge.