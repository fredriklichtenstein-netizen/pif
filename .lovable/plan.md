# Realtime "Interest" button across all UIs

## Today

- **Counters** are already realtime: `useInteractionCountsRealtime` subscribes to the `interests` table and pushes `interestsCount` into the global `useInitialCountsStore`. Cards consume that store, so the number on every card updates live.
- **Gaps that cause "stale" UI:**
  1. `showInterest` (whether *I'm* interested — drives the button's pressed/colored state) is only set on initial fetch and on my own click. If I tap "I'm interested" on one device/tab, the other device still shows the un-pressed button until reload.
  2. `interestedUsers` (the avatar list / "who's interested" sheet) is only refetched after my own toggle, never when *another* user shows interest.
  3. List pages — `InterestedPifsGrid` ("My interests") and `InterestsInMyPifsList` ("Interests in my pifs") — don't react to realtime inserts/deletes, so a new interest doesn't appear until a manual refresh.

## Plan

Mirror the comment-likes realtime pattern (per-item channel + optimistic dedupe + list subscription).

### 1. Extend `useInteractionCountsRealtime` to also push `showInterest`

- It already subscribes to `interests` for the item. Add a side-effect that, when the changed row's `user_id === current user.id`:
  - on `INSERT` → set local `showInterest` = true,
  - on `DELETE` → set local `showInterest` = false.
- Cleanest implementation: introduce a tiny global `useInterestStateStore` keyed by `itemId` (same shape as `useInitialCountsStore`), and have `useInterests` read `myInterestState[itemId]` to seed `showInterest`. The realtime hook writes to it. Skip-if-already-matches guard (optimistic update may have already applied) prevents flicker.

### 2. Realtime `interestedUsers` list

- In `useInterests`, on any realtime change to `interests` for this item (subscribe via the same channel or a thin wrapper), call `fetchInterestedUsersInternal(numericId)` debounced (~300 ms) so the avatar list and "who's interested" sheet refresh for everyone.
- Dedupe with current optimistic local state to avoid double-toggles for self.

### 3. Realtime updates on the two list pages

- `InterestedPifsGrid` (My interests) — subscribe to `interests` filtered by `user_id=eq.<currentUser>`. On `INSERT` add the card, on `DELETE` remove it. Light fetch of the new item row to render the card.
- `InterestsInMyPifsList` (Interests in my pifs) — subscribe to `interests` filtered to items owned by the current user. Either:
  - filter `item_id=in.(...)` based on the user's items (refresh when items list changes), or
  - subscribe broadly to `interests` and filter client-side against the loaded items in memory.
- Both should also re-rank/sort and update any per-item count badges.

### 4. Optimistic-action plumbing

- `useInterestActions.handleShowInterest` already does optimistic toggle. Keep it. The realtime handlers must skip when the incoming event matches our just-applied optimistic state (track a small `pendingMine` set keyed by `itemId` for ~1 s, or compare to current `showInterest`).

## Files to touch

- `src/hooks/item/realtime/useInteractionCountsRealtime.ts` — also emit per-user "isInterested" updates.
- New: `src/stores/myInterestStateStore.ts` (or extend `initialCountsStore`) — global `{ [itemId]: boolean }` for the current user's interest state.
- `src/hooks/item/useInterests.ts` — read from the new store; debounced realtime refetch of `interestedUsers`.
- `src/components/profile/InterestedPifsGrid.tsx` — subscribe to my `interests` and patch the grid.
- `src/components/profile/InterestsInMyPifsList.tsx` — subscribe to interests on my items and patch the list.
- (Optional) `src/hooks/item/interest/useInterestActions.ts` — register short-lived "pendingMine" marker to prevent flicker against incoming realtime echo.

## Out of scope

- No DB schema changes (the `interests` table is already in the realtime publication — counts hook already works).
- No design changes to the interest button.
- Demo Mode keeps its current local-store behavior.
