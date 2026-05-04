I traced the comment flow from feed loading through card state, lazy loading, insert, and realtime. I found multiple competing comment implementations and a few concrete break points.

Root causes identified:

1. Feed counters are seeded in the wrong place and with inconsistent RPC params
- The live feed uses `useOptimizedFeed` -> `getOptimizedPosts` -> `OptimizedQueries.getInteractionCounts`.
- `OptimizedQueries.getInteractionCounts` currently calls `get_bulk_interaction_counts` with `item_ids`, but the live Supabase RPC expects `p_item_ids`.
- The older `useFetchPosts` path was changed to use `p_item_ids`, but that is not the main feed path.
- Because the optimized path fails and falls back, counts can be stale/zero and the global initial-count store is not reliably seeded before cards render.

2. Initial card counters ignore the `post.commentsCount` prop
- `FeedItemCard` receives posts that already contain `commentsCount`, but it does not pass that count into `ItemCard`.
- `ItemCardProps` does not include initial counts, so every card creates its own `useItemComments` state starting from the global store or `0` instead of the feed item’s known count.

3. Clicking “Kommentera” mounts a second, separate comment system
- The item card owns `comments`, `commentsLoading`, and `commentsCount` through `useItemComments`.
- But `ItemCommentsSection -> CommentSection -> LazyCommentsSection` discards those props and mounts `LazyCommentsSection`, which creates its own `useLazyComments` state and fetch flow.
- This means the card’s loading/count state and the visible comments panel are not the same source of truth.

4. The lazy comments fetch path can get stuck because of nested hooks, fallback state, rate limiting, and abort-controller layers
- `LazyCommentsSection` uses `useLazyComments`, which calls `useComments`, which calls `useFetchComments`, which uses `useCommentRetry` and `runCommentQuery`.
- It is easy for this stack to enter fallback/loading/rate-limit states that are not reflected back to the parent card.
- The post-insert refetch and realtime code call different refresh functions from different hook instances.

5. Realtime sync only updates the visible lazy section, not the card counter consistently
- Comment realtime is mounted inside `LazyCommentsSection`, so it only exists while comments are open.
- The item-level realtime can detect comment table changes, but `refreshData` only calls `fetchItemComments()` when comments are open, so closed-card counters do not reliably update when another user comments.

Implementation plan:

1. Fix the bulk-count RPC call in the actual optimized feed path
- Update `src/services/database/queries.ts` so `OptimizedQueries.getInteractionCounts` calls:
  - `get_bulk_interaction_counts({ p_item_ids: itemIds })`
- Keep a defensive fallback to `item_ids` only if needed, but make `p_item_ids` the primary path.
- Add a temporary debug log for the result/error as requested earlier, but use `console.warn`/`console.error` responsibly and remove unnecessary noisy logs afterward if they are not needed.

2. Pass server-provided initial counts directly through the feed card props
- Extend `ItemCardProps` to include optional `likesCount`, `commentsCount`, and `interestsCount`.
- In `FeedItemCard`, pass `post.likesCount`, `post.commentsCount`, and `post.interestsCount` into `ItemCard`.
- In `ItemCardWrapper` / `useItemCardWrapper` / `useItemCard`, pass these initial counts down to `useItemComments`, `useLikes`, and `useInterests`.
- This removes the race where cards mount before the global store is populated.

3. Make `useItemComments` the single source of truth for each card
- Refactor `useItemComments(itemId, initialCommentsCount?)` to own:
  - `comments`
  - `commentsCount`
  - `showComments`
  - `commentsLoading`
  - `commentsError`
  - `fetchItemComments({ force })`
  - `addComment(text)` or a callback to update state after create
- Derive `commentsCount` from:
  - fetched `comments.length` after a successful fetch
  - otherwise `initialCommentsCount` / store count
  - optimistic increment immediately after a successful insert
- Sync every authoritative count update back to `useInitialCountsStore`.

4. Remove the duplicate lazy comment state path from item cards
- Stop rendering `LazyCommentsSection` inside the item card flow, or convert it to a pure presentational component that receives parent-owned state and callbacks.
- `ItemCommentsSection` should render `CommentsPanel` directly using the `comments`, `isLoading`, `error`, and handlers owned by `useItemComments`.
- Clicking “Kommentera” should call exactly one fresh fetch on the first click and then render the same fetched array.

5. Simplify comment fetching to one reliable database function
- Create or consolidate a `fetchCommentsForItem(itemId, userId?)` helper that directly queries `comments` with profiles:
  - `comments.select(id, content, created_at, user_id, item_id, profiles:user_id(...))`
  - `eq('item_id', numericItemId)`
  - `is('parent_id', null)` if top-level-only is desired
  - `order('created_at', { ascending: true })`
- Do not use a shared/reused AbortController for this normal card fetch.
- Use fresh calls for open/refetch/post-insert paths.
- Keep demo-mode handling separate and simple.

6. Make posting update UI immediately and then verify from DB
- On successful insert:
  - append/replace the returned comment in the parent-owned `comments` array without duplicates
  - immediately set `commentsCount` to the updated array length
  - update `useInitialCountsStore`
  - schedule a fresh DB refetch after 300ms to confirm canonical state
- Keep the requested log after insert success:
  - `console.log('[useCommentCreate] Triggering refetch')`

7. Rework comment realtime and polling around the parent state
- Mount a lightweight realtime subscription per visible/open card comment panel, and optionally have item-level realtime update counters while closed.
- For comments panel realtime:
  - subscribe to `INSERT` on `comments` filtered by `item_id`
  - on insert, trigger the same parent-owned `fetchItemComments({ force: true })`
  - if subscription fails or times out, start polling every 15s with exponential backoff: 15s -> 30s -> 60s -> 120s max, reset to 15s on success
- For closed-card counters:
  - when item-level realtime sees comment changes, refresh only the bulk count for that item or increment/decrement the count safely, without forcing the whole comments list to load.

8. Clean up stale/noisy comment modules after the reliable path is in place
- Either remove unused `LazyCommentsSection` fetch ownership from item cards or leave it only for routes that genuinely need it, but avoid two independent comment stores for the same card.
- Remove unused imports/props caused by the refactor.
- Keep production logging aligned with project memory: no unnecessary `console.log` except the temporary requested debug lines; retain `console.warn`/`console.error` for real failures.

Expected result after implementation:

- Feed counters show correct comment counts immediately from the optimized bulk RPC and/or post props.
- First click on “Kommentera” performs one fresh fetch and displays comments without getting stuck.
- Posting a comment immediately updates the visible list and counter, then reconciles with a DB refetch after 300ms.
- Other users’ comments appear via realtime when available, and via polling fallback with exponential backoff when realtime is unavailable.
- The app no longer has two competing comment states for the same item card.