## Lovable implementation plan for approval

**Root cause confirmed:** `/messages` renders `ConversationView.tsx` (inline), not the standalone `/conversation/:id` page (`Conversation.tsx`). `useConversationDetails` already fetches and returns `fulfillerNote`, but `ConversationView` never destructures or renders it. That's why the amber card never appears for Fredrik in the inline thread.

### Diffs

**1. `src/components/messaging/ConversationView.tsx`**
- Destructure `fulfillerNote` from `useConversationDetails(conversationId)` (currently only pulls `conversation, otherParticipant, item, isLoading`).
- Inside the scrollable messages container (`<div ref={messagesContainerRef} className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">`), render the amber sticky context card as the FIRST child, before the loading/empty/messages branch:
  ```tsx
  {fulfillerNote && (
    <div className="sticky top-0 z-10 mb-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 shadow-sm">
      <p className="text-[11px] font-medium uppercase tracking-wide text-amber-700">
        {t('interactions.helper_offer_context_title')}
      </p>
      <p className="mt-1 text-sm italic text-amber-900">
        "{fulfillerNote}"
      </p>
    </div>
  )}
  ```
- Owner-only + wish-only + non-empty gating is already enforced inside `useConversationDetails` (only sets `fulfillerNote` when `isWish && item.user_id === currentUserId && note.trim()`), so no extra guard needed in the component.

**2. `src/hooks/useConversationDetails.ts`** — remove diagnostic logs:
- Delete the `console.log('[fulfillerNote:debug]', {...})` block (lines 190–201).
- Delete `console.log('[fulfillerNote:debug] interests row →', ...)` (line 209).
- Delete `console.log('[fulfillerNote:debug] skipped fetch', ...)` (line 213).

**3. `src/pages/Conversation.tsx`** — remove diagnostic log:
- Delete the render-time IIFE on line 138: `{(() => { console.log('[fulfillerNote:debug] render', { fulfillerNote }); return null; })()}`. Keep the amber card block itself unchanged.

### Notes
- No changes to hook logic, styling, i18n keys, or business rules. Purely presentational parity between the two conversation surfaces + log cleanup.
- Sticky positioning inside `overflow-y-auto` container works the same way as in `Conversation.tsx` — card stays pinned to top of the messages viewport as user scrolls.
