## Lovable implementation plan for approval

### Root cause investigation

Traced the archived-filter path end-to-end. The **query layer is correct**: `OptimizedQueries.getPosts` (`src/services/database/queries.ts` lines 34–43) uses `.in('pif_status', ['archived','completed'])` when `includeArchived` is true, so the server returns only terminal-status rows. The **secondary cache boundary** (`applyArchiveBoundary` in `src/services/posts/optimized.ts` lines 27–30) also filters correctly, and the **React Query aggregator** (`useOptimizedFeed` lines 262–279) keeps only `isArchivedPost` items when `includeArchived` is true.

So in isolation each layer looks correct — but the bug is reproducible in the UI, which means one of the following is happening:

**Most likely cause:** the `page` counter is **not reset** when the `includeArchived` toggle flips. `useOptimizedFeed` swaps the React Query key (which includes `includeArchived`), but keeps `page` at whatever it was on the active feed. The `allPosts` memo then iterates `for (i = 0; i <= page; i++)` reading `queryClient.getQueryData(['posts','optimized', i, includeArchived, feedVersion])`. Two side effects follow:
1. Pages `0 .. page-1` are missing under the new key, so archived items are shown only for the current page's offset — a partial/wrong page.
2. Because the current query fires with the old `page` value, the archived query is issued with a non-zero offset. Combined with an unreset `feedVersion`, stale React Query entries under an older `feedVersion` for `includeArchived=false` can still be found by any getQueryData lookup that doesn't match `feedVersion` — and the `page`+`includeArchived` mismatch also opens a small window where the previous active-feed pages remain in the aggregated result while a fresh archived fetch resolves.

**Contributing weakness:** the client-side filter inside `allPosts` trusts server + cache to already be scoped. But if any stale cache entry (React Query or `DatabaseCache`) leaks a non-archived row into the archived key, the filter passes it through only because it doesn't re-check pif_status when `includeArchived=true` (line 275 returns `isArchivedPost` — correct) — however, `Post.pif_status` is *not* set by `transformPostData`; only `Post.status` is populated. The filter reads both `(p as any).status` and `(p as any).pif_status`; the second is always undefined for transformed posts. This is safe today (`status` carries pif_status), but it means there is no defense-in-depth if `status` is ever cleared/renamed.

### Fix

1. **Reset `page` and clear stale in-memory caches whenever `includeArchived` changes** in `src/hooks/feed/useOptimizedFeed.ts`:
   - Add an effect that runs on `includeArchived` change: `setPage(0)`, clear `fadingIds` / `activeArchivedIds` / `restoringIds`, call `clearPostsCache()`, bump `feedVersion`, and invalidate optimized queries. This guarantees the archived view starts fresh at page 0 with no leftover active pages in the aggregated view.

2. **Harden `allPosts` aggregation** in the same file:
   - Skip pages whose cached data is `undefined` (already true), but also short-circuit the loop so it only aggregates pages that actually belong to the current `(includeArchived, feedVersion)` pair — this is implicit with the reset above but worth keeping explicit.

3. **Defense in depth at the render layer** in `src/components/feed/OptimizedFeedContainer.tsx`:
   - Inside the `fullyFilteredPosts` memo, add a final guard: when `effectiveIncludeArchived` is true, keep only posts that are terminal (`status === 'archived' || status === 'completed' || archived_at != null`); when false, drop any post that is terminal. This mirrors the boundary and ensures no path — realtime, prefetch, or race — can leak the wrong bucket into the rendered list.

4. **No query change needed.** The server-side `.in('pif_status', ['archived','completed'])` filter is already correct.

### Files touched

- `src/hooks/feed/useOptimizedFeed.ts` — add the `includeArchived`-change reset effect.
- `src/components/feed/OptimizedFeedContainer.tsx` — add the archive-boundary guard inside `fullyFilteredPosts`.

### Verification

- Toggle "Visa endast arkiverade" on with active-feed pagination already advanced: list should immediately show only archived items, no active items at the bottom.
- Toggle it off again: list should return to active-only with no archived leaking in.
- Archive an item while viewing archived: it should appear; restore it: it should disappear from the archived list.
