## Lovable implementation plan for approval

### Root cause

Toggling the archived filter changes React Query's key inside `useOptimizedFeed`, but it does NOT unmount the hook. As a result, when the filter flips:

- The realtime channel `feed-shared-realtime` (fixed name, no key suffix) is torn down and re-created via its `[queryClient, includeArchived]` effect — the teardown and resubscribe overlap briefly on the same channel name, and the invalidation calls inside the realtime handler (`invalidateOptimizedFeedQueries`) fan out to *every* `['posts', 'optimized', ...]` query in the cache, not just the current one.
- Existing observers of the previous key (still alive during the transition, plus any that React Query keeps around under StrictMode's double-mount in dev) get refetched. That's the HAR footprint: one request for `pif_status=in.(archived,completed)` and, simultaneously, one for the active `or=(pif_status.is.null, ...)` filter — two different keys, both observed, both refetched.
- The reset effect I added last turn (bumping `feedVersion`, clearing caches, invalidating) actually *worsens* this: it fires an extra invalidation after the toggle, which is what pushes the stale-observer refetch over the line into the HAR.

So the container is not literally rendered twice — but `useOptimizedFeed` keeps its realtime subscription, its `useQuery` observer, its in-flight loaders, and its cache-generation counter across a filter change. Old and new observers coexist for the transition window, and both fire.

### Fix

Force a clean remount of everything that owns the feed's queries and realtime channel when `includeArchived` changes. The rest of the container (filter pills, header, refresh UX, distance/interests state) stays mounted so scroll position and filter panel state on the filter row itself are preserved.

1. **Split `OptimizedFeedContainer` into two pieces**:
   - `OptimizedFeedContainer` (outer) keeps the local `includeArchived` state, `FeedFiltersPanel`, profile header, refresh wiring, and layout.
   - `OptimizedFeedBody` (new inner component in the same file) owns `useOptimizedFeed`, the posts memoization, `useDistanceFiltering`, hydration effects, `FeedItemList`, and the infinite-scroll sentinel. It receives `includeArchived` (and the props it needs) from the outer.

2. **Key the inner component on the filter identity**:
   ```
   <OptimizedFeedBody key={effectiveIncludeArchived ? 'archived' : 'active'} ... />
   ```
   Toggling the filter unmounts the old body (which runs `useOptimizedFeed`'s cleanup: `supabase.removeChannel`, timer clears, React Query observer unsubscribe) *before* the new body mounts and subscribes. Only one feed instance is ever active.

3. **Remove the fragile reset effect** added last turn in `useOptimizedFeed` (`isFirstArchivedEffect` + `setFeedVersion` on `includeArchived` change). The keyed remount replaces it — no more overlapping invalidations, no more `feedVersion` bump firing an extra fetch. `feedVersion` still exists for realtime-driven refreshes.

4. **Namespace the realtime channel by scope** so a leftover subscription can't collide with a fresh one during hot-reload:
   ```
   supabase.channel(`feed-shared-realtime-${includeArchived ? 'arch' : 'active'}`)
   ```
   With the keyed remount this is defense-in-depth, but it makes any future double-mount safe.

5. **Keep the render-layer archive-boundary guard** in `fullyFilteredPosts` (added last turn) as defense-in-depth against any transient cache leak.

### Files touched

- `src/components/feed/OptimizedFeedContainer.tsx` — extract inner `OptimizedFeedBody`, add keyed remount.
- `src/hooks/feed/useOptimizedFeed.ts` — remove the `isFirstArchivedEffect` reset effect; namespace the realtime channel by `includeArchived`.

### Verification

- Toggle "Visa endast arkiverade" on/off with the network panel open: exactly one items-table request per toggle, matching the current filter. No parallel active + archived request.
- Scroll position resets on toggle (expected — new list); filter pills stay put.
- Archive an item from the active feed → it disappears; toggle to archived → it appears; toggle back → it stays gone from active.
