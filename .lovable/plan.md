
Fix the remaining archive/restore feed sync by rebuilding the active `/feed` path around the components that are actually mounted today, then clearing the feed’s extra cache layer so restored items can re-enter immediately.

### Root causes to fix

1. **The current feed uses the optimized feed stack, not the legacy one**
   - `/feed` renders `OptimizedFeedContainer`, not `FeedContainer`.
   - Some earlier fixes targeted the legacy feed path, so they do not affect the live `/feed` route.

2. **The current item-card delete flow is split across two dialog systems**
   - `src/components/item/ItemCardHeader.tsx` contains the active `SimpleDeleteDialog`.
   - But the header currently delegates owner delete/archive clicks to `handleDeleteClick`, which goes through `useItemCardActions`.
   - That path expects `GlobalDeleteDialog` / `ItemDialogs`, but those are not mounted in the active tree.
   - Result: the live card flow is inconsistent, and the feed does not reliably emit/update the right state when archiving from the feed.

3. **Restore is blocked by stale feed cache outside React Query**
   - `useOptimizedFeed` invalidates React Query on restore.
   - But `getOptimizedPosts()` also reads from `DatabaseCache` in `src/services/posts/optimized.ts`.
   - That means a restored item can stay missing until the extra cache expires, even after query invalidation.

### What to change

#### 1) Make the active feed cards use one archive flow only
Update the current item-card stack so owner archive actions in the feed always open the already-present local `SimpleDeleteDialog`, instead of routing through the unused global delete-manager path.

Files:
- `src/components/item/ItemCardHeader.tsx`
- `src/components/item/ItemCardWrapperContent.tsx`
- `src/components/item/ItemCardWrapper.tsx`
- `src/components/item/types.ts`

Implementation:
- Change the owner menu action in `ItemCardHeader` to open `SimpleDeleteDialog` directly for the current item-card stack.
- Stop depending on `handleDeleteClick` for the active feed/profile item cards.
- Thread a real operation callback upward so the active card can notify the feed/profile immediately with `(itemId, operationType)` in addition to the document event.

Result:
- Archiving from `/feed` uses the same path every time.
- The archive event fires from the mounted dialog/hook that the feed actually depends on.

#### 2) Patch the optimized feed cache immediately on archive/delete
Strengthen `useOptimizedFeed` so archive/delete removes the item from both:
- the local `removedIds` animation state, and
- all cached `['posts', 'optimized', page]` query pages.

File:
- `src/hooks/feed/useOptimizedFeed.ts`

Implementation:
- On `item-operation-success` with `archive` or `delete`:
  - keep the existing fade-out behavior,
  - also prune that item ID out of every cached optimized-feed page via `queryClient.setQueriesData`.
- Clear the custom posts cache when destructive operations complete so later refetches cannot resurrect stale items.

Files:
- `src/hooks/feed/useOptimizedFeed.ts`
- `src/services/posts/optimized.ts` (reuse `clearPostsCache()`)

Result:
- The item disappears immediately from the rendered feed.
- A delayed background refresh cannot bring it back from stale cache.

#### 3) Make restore repopulate the feed from a fresh source
Restore should not rely on React Query invalidation alone.

Files:
- `src/hooks/feed/useOptimizedFeed.ts`
- `src/services/posts/optimized.ts`

Implementation:
- On `restore`:
  - remove the item from `removedIds`,
  - clear the custom posts cache with `clearPostsCache()`,
  - remove/invalidate all optimized-feed query pages,
  - reset the optimized feed to page 0 and refetch fresh page-0 data.
- Keep the undo/restore fade-in behavior after the fresh data arrives.

Result:
- Restored items reappear in `/feed` without a manual refresh.
- This works even if the restored item should return to page 0 and was previously absent from cached pages.

#### 4) Keep My PIFs/Profile synced through the same active event path
Even though the latest report says issue 2 is resolved, the same unified event path should remain the source of truth for profile grids.

File:
- `src/components/profile/MyPifsGrid.tsx`

Implementation:
- Keep the existing archive/delete immediate removal and restore refetch logic.
- Ensure it now receives events from the same active `SimpleDeleteDialog` path used in feed cards.

### Technical details

```text
Current live route
/feed
  -> OptimizedFeedContainer
  -> FeedItemList
  -> FeedItemCard
  -> ItemCard
  -> ItemCardHeader + SimpleDeleteDialog

Problem
ItemCardHeader currently delegates to a different delete system
that expects GlobalDeleteDialog / ItemDialogs, but those are not mounted.

Fix
Use the mounted SimpleDeleteDialog path for current item cards,
and make useOptimizedFeed update both:
1) local fade/remove state
2) cached query pages
3) custom DatabaseCache
```

### Files to update

- `src/components/item/ItemCardHeader.tsx`
- `src/components/item/ItemCardWrapper.tsx`
- `src/components/item/ItemCardWrapperContent.tsx`
- `src/components/item/types.ts`
- `src/hooks/feed/useOptimizedFeed.ts`
- `src/services/posts/optimized.ts`
- `src/components/profile/MyPifsGrid.tsx` (verify only; minimal change if needed)

### Expected behavior after the fix

- Archiving from `/feed` removes the item instantly, without refresh.
- Restoring from archived items makes the item reappear in `/feed` automatically.
- The same archive/restore action continues to sync with My PIFs and Archived items.
- No stale-cache delay remains between archive/restore operations and what the user sees.
