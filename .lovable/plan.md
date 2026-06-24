# Fix raw notification headlines + clarify wish system-message verification

## Issue 1: Raw type strings shown as notification headlines

**Root cause (confirmed by reading `src/hooks/useNotifications.ts`):**

Both transform functions (initial fetch at line 151-169 and realtime row transform at line 183-201) build the in-memory `Notification` object with:

```ts
type: n.type,
title: n.type,   // ← bug: raw type string assigned as title
```

They never consult `payload.title`, even though every insert site (e.g. `InterestSelectionList.tsx` line 438 for `selection_made`, and the server-side `notify_item_interest_event` RPC for `helper_selected`/`receiver_selected`) populates `payload.title` with a properly worded Swedish sentence.

Then `NotificationList.tsx`:
- For `interest_received`, `receiver_selected`, `selection_made` → branches and overrides `displayTitle` with custom copy, so the bug is masked.
- For **`helper_selected`** (wish equivalent of `receiver_selected`) → no branch exists; it falls through to `displayTitle = notif.title`, which is the raw type string.
- For `selection_made` → the branch does `displayTitle = notif.title || fallback`. Because `notif.title` is the non-empty raw type string `"selection_made"`, the `||` short-circuits and the raw string wins over the fallback.

This is exactly the "helper_selected vs selection_made inconsistency" previously flagged — same underlying bug, two symptoms.

### Fix

**A. `src/hooks/useNotifications.ts`** — in both `transformed` map (line 151-169) and `transformRow` (line 183-201), prefer the payload title and add `content` mapping:

```ts
title: p.title ?? n.title ?? n.type,
content: p.content ?? p.body ?? n.content ?? null,
```

Add `content?: string | null` to the `Notification` interface (line 68-80) if not already present.

**B. `src/components/notifications/NotificationList.tsx`**:

1. Extend the `isReceiverSelected` branch to also match `helper_selected` (wish-side counterpart):
   ```ts
   const isReceiverSelected =
     notif.type === 'receiver_selected' ||
     notif.type === 'selection' ||
     notif.type === 'helper_selected';
   ```
   So a chosen wish helper sees the same rendered structure (CTA to conversation) as a chosen pif receiver.

2. In the `isSelectionMade` branch (line 164), replace `notif.title || fallback` with a guard that rejects the raw type string:
   ```ts
   const safeTitle = notif.title && notif.title !== notif.type ? notif.title : null;
   displayTitle = safeTitle ?? fallback;
   ```
   Apply the same `safeTitle` pattern anywhere else a branch falls back to `notif.title`.

3. Default case (no branch matched): when rendering `displayTitle = notif.title`, fall back to a generic readable label when `notif.title === notif.type`, e.g. `t('interactions.notification_generic', 'Ny avisering')`. This protects against any future type we forget to branch.

## Issue 2: Wish system-message re-verification

**Answer: the early-return guard exists.**

In the live `_insert_pif_system_messages` (and in the drafted migration `db/manual_migrations/wish_aware_system_messages.sql`, preserved byte-for-byte from the original):

```sql
select count(*) into v_existing
  from public.messages
 where conversation_id = p_conversation_id
   and is_system_message = true;
if v_existing > 0 then
  return;
end if;
```

Re-triggering selection on an existing wish/conversation that already contains system messages is a **no-op** — the function returns immediately and no new rows are inserted. The text the user saw is the original pre-fix copy still sitting in `messages`, not output from the new wish branch.

**No code change needed for #2.** Once the migration is applied, verification must use a **brand-new wish** (newly posted request → first-ever helper selection on it → conversation created from scratch). Re-selection on an existing wish conversation cannot test the new wording.

Recommended verification recipe after the migration runs:
1. Post a new request as account A.
2. As account B, mark interest.
3. As account A, open the interest list and select B.
4. Open the new conversation — both system messages should show the new multi-fulfiller-neutral wording and include the description.

## Out of scope

- No DB migration changes in this round. The `wish_aware_system_messages.sql` migration is already approved and unchanged.
- WebSocket disconnects (previously deprioritized) — untouched.

## Files to edit

- `src/hooks/useNotifications.ts` — fix title/content mapping in both transform sites; extend `Notification` interface if needed.
- `src/components/notifications/NotificationList.tsx` — add `helper_selected` to receiver-selected branch; harden `selection_made` and default-case title fallback against raw type strings.

---

## Follow-up round (2026-06-24)

Three additional bugs surfaced from real wish-selection testing:

### #1 — Conversation list preview shows same text for both sides
`useConversations.ts` ignored `target_user_id` when building list previews. `_insert_pif_system_messages` writes two per-recipient system messages — both sides ended up with whichever inserted last. Fixed: skip messages targeted at OTHER users in both the initial fetch (`lastByConv`) and the realtime INSERT preview-overwrite.

### #2 — Fulfiller notification used pif language
Two layers fixed:
- DB migration `db/manual_migrations/wish_aware_helper_selected_notification.sql` rewrites the `helper_selected` branch of `notify_item_interest_event` to wish-aware, multi-fulfiller-neutral copy. All other branches preserved byte-for-byte.
- `NotificationList.tsx` `isReceiverSelected` branch now respects `safeTitle` (payload title) when `type === 'helper_selected'`, so the server copy actually renders.

### #3 — Wisher's self-notification wording
`InterestSelectionList.tsx` line 428-430: wish wording changed from "som ska uppfylla" to "till att uppfylla" to match the multi-fulfiller-neutral standard. Name already included.

## Backlog (priority — DO NOT fix wording before logic)

`notify_item_interest_event` still has `wish_reopened`, `wish_archived`, and `wish_completed` branches that frame the wish as a single-fulfiller state machine (e.g. "Önskningen är nu öppen igen" implies the wish was closed by one fulfiller's selection — wrong for multi-fulfiller wishes). These mirror the same withdraw_pif multi-fulfiller-scoping bug already flagged elsewhere. **Do not re-word these branches until the underlying state-transition logic is corrected** — rewording first would mask the real bug.

## Pickup-address follow-ups (flagged, deferred)

- **ProfileEdit duplication smell** — `src/pages/ProfileEdit.tsx` maintains its own inline `handleSubmit` / `fetchProfileData` / local type definition instead of using `useProfileSubmit` / `useProfileFetch`. This caused the door-code/floor/instructions save bug (two parallel implementations, only one updated). Refactor ProfileEdit to consume the shared hooks so the next pickup-field addition only needs one edit site.
- **Edit-mode pickup_address_mode display gap** — `usePostFormState`'s profile-prefill `useEffect` early-returns when `initialData?.id` is set (edit mode), so `primary_address` is never loaded during edit. The pickup-address toggle then defaults to "primary" with an empty primary address displayed. Fix: fetch the profile's `address` even in edit mode (kept separate from the "don't overwrite existing values" prefill logic for the other fields). Best done in the same pass as the ProfileEdit refactor above.


## Realtime channel-dedupe audit (2026-06-24)

After three crashes in one session (`useCachedProfile`, `useNotifications`, `useUnreadMessagesCount`) all hitting `cannot add postgres_changes callbacks ... after subscribe()`, all three hooks were refactored to a refcounted shared-channel pattern (module-level `Map<scopeKey, { channel, listeners }>` + `ensureXChannel` / `releaseXChannel`).

### Methodology rule going forward

When introducing any `supabase.channel(`...${scope}`)` in a hook or component, evaluate co-mount risk by asking:
1. Does MainNav (globally mounted on every authenticated page) call this hook? If yes AND any page/component in the same tree also calls it → multi-mount-risky.
2. Can two components rendered simultaneously (page + its modal/drawer/panel, or two siblings) both call it with the same scope key? If yes → multi-mount-risky.

Counting call sites in the codebase is NOT sufficient — that's what missed `useUnreadMessagesCount`. Any hook matching (1) or (2) must use the refcounted-channel pattern.

### Latent risks (no action until a second simultaneous mount actually happens)

- **`usePifCompletion`** (`pif-completion:${id}`) — called from `ConversationView`, `PostModal`, and `InterestSelectionList`. Currently safe because these don't render together with the same `id`, but if any two ever co-mount for the same item, it crashes. Refactor to refcounted pattern at that point.
- **`useProfileAvatar`** (`profile-avatar-changes` — note: FIXED topic, no scope suffix) — only called from `ProfileEdit` today, so single-mount. But the fixed topic means any future second consumer crashes instantly on first co-mount. Refactor to refcounted pattern when adding a second consumer.

