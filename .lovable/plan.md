## Lovable implementation plan for approval

### FIX 1 findings — mobile conversation rendering path

- `src/routes/routeConfig.tsx` only registers `/messages`. There is **no `/conversation/:id` route** anywhere in the app.
- `src/pages/Conversation.tsx` exists but is **not imported by any router or component** (verified with codebase search — zero references).
- Therefore mobile and desktop both open a conversation the exact same way: `Messages.tsx` sets `activeConversationId` and renders `<ConversationView conversationId=... />`. The mobile layout just hides the list column (`hidden md:block`) and shows the ConversationView column full‑width — but it is the same component instance that already has the `[cv:debug]` log and the amber card wired.
- Conclusion: there is no second rendering path to patch. The reason the `[cv:debug]` line didn't appear in the mobile console is almost certainly a stale bundle / cached service worker on the phone, not a routing gap. A hard reload on mobile will surface the log. No mobile‑specific code change is needed for parity.

I will also delete the unused `src/pages/Conversation.tsx` (dead code with its own copy of the amber card) so this ambiguity can't come back.

### FIX 2 — restyle the note as an inline system message

In `src/components/messaging/ConversationView.tsx`:

1. Remove the current amber sticky block (currently rendered above the messages list).
2. Render the note **inside the messages list as its first child**, using the same visual treatment as `MessageItem.tsx`'s `is_system_message` branch:
   - Container: `flex justify-center my-2`
   - Bubble: `max-w-[85%] rounded-lg bg-muted/60 border border-border px-3 py-2 text-center`
   - Small caps label: `text-[10px] uppercase tracking-wide text-muted-foreground mb-1` with `t('messages.system_message_label', { defaultValue: 'Systemmeddelande' })`
   - Body: `whitespace-pre-wrap break-words text-sm text-foreground`, showing the note wrapped in curly quotes (or plain — will keep plain to match existing system messages; the existing `interactions.helper_offer_context_title` string can be dropped since the "SYSTEMMEDDELANDE" label already frames it).
3. Keep the exact same gating that already lives in `useConversationDetails` (owner + wish + non-empty note), so no extra conditional logic in the component.
4. Remove the `[cv:debug]` `console.log` added on line ~72.

### Cleanup

- Delete `src/pages/Conversation.tsx` (unrouted, contains an outdated duplicate of the amber card).
- No changes to `useConversationDetails.ts` (already clean after the previous pass).
- No i18n key changes needed; reuses the existing `messages.system_message_label`.

### Out of scope

- No changes to hook logic, DB, styling tokens, or other components.
- No new translations.
