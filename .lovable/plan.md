
## Goal

Make likes / comments / interests reliably update in realtime across all UIs, eliminate the spurious "couldn't update" errors, and make the counter number next to each button consistently open a popup listing the users behind that count (including comments).

## Diagnosis

After tracing the code paths there are four distinct bugs causing the symptoms you described.

### 1. Counter popup is a `<button>` inside a `<button>`

In `InteractionButtonWithPopup.tsx` the entire row is wrapped in one outer `<button onClick={handleButtonClick}>`. Inside that button we render `<CounterButton>`, which itself renders a `<PopoverTrigger asChild><button>…</button></PopoverTrigger>`.

Nested buttons are invalid HTML. Browsers fold the inner click into the outer one, so the popover trigger almost never fires (and when it does, also toggles like/interest). That is why:
- Like popup "very occasionally" works (only when the click lands exactly on the inner span).
- Interest popup "never" works (on small viewports the outer button consumes every tap).
- Comments has no popup at all because `CounterButton` is hard-coded `isInteractive=false` for `type === "comment"`.

### 2. Like INSERT collides with stale optimistic state

`useLikes.handleLike` flips `isLiked` then runs `INSERT … FROM likes` with no `onConflict`. When realtime is slightly behind, the local state believes "not liked" but the row already exists → unique-constraint error → we revert the optimistic flip and show the red "Kunde inte uppdatera gillningsstatus" toast. Interests was already fixed with `upsert({ onConflict: 'user_id,item_id', ignoreDuplicates: true })`; likes needs the same pattern (and DELETE should treat "row not found" as success).

### 3. Realtime updates the count but not the user list

`useInteractionCountsRealtime` keeps `likesCount` / `interestsCount` / `commentsCount` in sync via HEAD COUNT queries, but the `likers` / `interestedUsers` / `commenters` arrays on the card are only refreshed:
- on initial mount, or
- (for interests) inside `useItemInterestRealtime` via a debounced refetch.

There is no equivalent `useItemLikesRealtime` and no commenters refetch. So when another user likes/comments while a card is mounted, the counter ticks up but the popover list stays empty → "Inga gillningar än" / "Ingen mottagare än" even though the count says 1.

### 4. Shared channel never recovers from errors

`itemRealtimeManager` creates the channel once and stores its status. On `CHANNEL_ERROR`, `TIMED_OUT`, or `CLOSED` (network blip, tab sleep, JWT refresh) it never re-subscribes, so the card silently goes "stale" until a full reload — matching the "occasionally fail to load / take very long" symptom. We also have no polling fallback when realtime is unhealthy.

## Changes

### A. Restructure the interaction button to fix the popup

`src/components/post/interactions/InteractionButtonWithPopup.tsx`
- Replace the single outer `<button>` with two siblings inside one container:
  1. A clickable area containing the icon + label that calls `handleButtonClick` (toggle).
  2. Beside/below it, the `CounterButton` rendered as its own popover trigger.
- Use `<div role="button" tabIndex={0} onClick={…} onKeyDown={…}>` for the toggle area so it is no longer a real `<button>` parent — eliminates the nested-button issue.
- Stop using `popupUsers.length` to override `count` in `displayCount`; always show the authoritative `count` from props so realtime store updates are visible immediately.

### B. Make the counter popup work for comments too

`src/components/post/interactions/button/CounterButton.tsx` and `UserPopoverContent.tsx`
- Add `"comment"` to the `type` union and a third popover content variant that lists commenters (avatar + name, click → open the comments panel for full context).
- `PrimaryActions` and `ActionButtons` already receive `commenters` upstream via `ItemInteractions` props; thread `commenters` and a `fetchCommenters` callback into the `comment` `InteractionButtonWithPopup`.
- Add a tiny `fetchCommenters(itemId)` helper that runs a `select user_id from comments where item_id = … group by user_id` followed by a profile lookup (mirrors `fetchLikersInternal`).

### C. Fix the like error & make toggles idempotent

`src/hooks/item/useLikes.ts`
- Change `INSERT` to `upsert([{ user_id, item_id }], { onConflict: 'user_id,item_id', ignoreDuplicates: true })`.
- Treat the `DELETE` "no rows affected" path as success.
- Drop the post-action `await fetchLikersInternal(numericId)` round-trip from the optimistic path (rely on realtime to sync the list, like interests now does), so the UI no longer depends on the network call to look correct.

Mirror the same hardening in `useInterestActions` if any path still throws on duplicates (already partially done — verify).

### D. Realtime user-list refresh for likes & comments

New `src/hooks/item/realtime/useItemLikesRealtime.ts`
- Mirrors `useItemInterestRealtime`: subscribes via the shared per-item channel for table `likes`, debounces, and calls a supplied `onAnyChange()` so `useLikes` can re-run `fetchLikersInternal`.
- Wire it into `useLikes` exactly like interests does.

`src/hooks/comments/useCommentRealtime.ts` / `useLazyComments.ts`
- When `useCommentCountRealtime`'s `onChange` fires, also invalidate the cached commenters list used by `ItemInteractions` (so the comment counter popup rebuilds). Expose a `fetchCommenters` from `useItemCard`-level hooks.

### E. Make the shared channel self-heal

`src/services/realtime/itemRealtimeManager.ts`
- In the `channel.subscribe` status callback, when status is `CHANNEL_ERROR`, `TIMED_OUT`, or `CLOSED`, schedule a re-subscribe with exponential backoff (1s → 2s → 5s → 10s, capped) as long as `refCount > 0`.
- Re-emit the new status to all `statusListeners` so polling fallbacks can engage / disengage.
- Also subscribe to `window` `online` / `visibilitychange` once at module load and force an immediate resubscribe of all entries when the tab becomes visible / network returns.

`src/services/realtime/commentLikesManager.ts`
- Apply the same self-healing pattern.

### F. Lightweight polling fallback while channel is unhealthy

In `useInteractionCountsRealtime`, `useItemInterestRealtime`, `useItemLikesRealtime`, and `useCommentCountRealtime`:
- Use `subscribeItemStatus` from the manager. While status ≠ `SUBSCRIBED`, run a 15s `setInterval` that re-runs the same HEAD COUNT / list refetch the realtime handler would have done. Stop polling once `SUBSCRIBED` returns.
- This gives a hard upper bound on staleness even when realtime is broken.

## Files touched

```text
src/components/post/interactions/InteractionButtonWithPopup.tsx   (restructure)
src/components/post/interactions/button/CounterButton.tsx         (add comment variant)
src/components/post/interactions/button/UserPopoverContent.tsx    (comment list)
src/components/post/interactions/PrimaryActions.tsx               (pass commenters + fetchCommenters)
src/components/post/interactions/ActionButtons.tsx                (same)
src/components/post/ItemInteractions.tsx                          (wire fetchCommenters)
src/components/item/ItemInteractions.tsx                          (same)
src/hooks/item/useLikes.ts                                        (upsert + realtime list refresh)
src/hooks/item/useInterests.ts                                    (verify upsert path)
src/hooks/item/realtime/useItemLikesRealtime.ts                   (NEW)
src/hooks/comments/useCommentCountRealtime.ts                     (expose commenters refresh)
src/hooks/item/useItemCard.tsx / useItemCardUsers.tsx             (fetchCommenters helper)
src/services/realtime/itemRealtimeManager.ts                      (self-heal + visibility)
src/services/realtime/commentLikesManager.ts                      (self-heal)
```

## Validation

- Manual: open the same item in two browser windows; like/comment/show interest in one and confirm counters AND popover lists update within ~1s in the other, with no error toast.
- Manual: tap the counter number on each of the three buttons (like / comment / interest) on mobile viewport (460px) and confirm a popover with the user list opens every time, without also toggling the action.
- Tab-sleep test: leave a card mounted, sleep the tab for >2 min, return — counters should reconcile within 15s via polling fallback.
- `bunx tsc --noEmit` after changes.
