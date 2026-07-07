## Lovable implementation plan for approval

### Findings from code inspection

**1. What the boundary guard actually checks** (`src/components/feed/OptimizedFeedContainer.tsx`, inside `OptimizedFeedBody.fullyFilteredPosts`):

```ts
const isTerminal = (p: Post) => {
  const s = (p as any).status ?? (p as any).pif_status;
  return s === 'archived' || s === 'completed' || !!p.archived_at;
};
const bucketed = effectiveIncludeArchived
  ? base.filter(isTerminal)          // archived view: keep ONLY terminal
  : base.filter((p) => !isTerminal(p));
```

- It reads `effectiveIncludeArchived` from **props** (passed from the outer container). The inner body is keyed on that same value, so the value the guard sees is always the one this mounted body was created with — there is no outer/inner drift window.
- `??` is nullish-coalescing, so `status = ''` (which is what `transformPostData` sets for an active row: `status: item.pif_status || item.status || ''`) does fall through to `pif_status`, but the transformed `Post` object no longer carries `pif_status` — only `status`. For an active row, `status === ''`, `archived_at` is null, so `isTerminal → false`, and the archived-view filter correctly excludes it.

**Conclusion:** the guard is correct for genuinely-active rows. It will not let a row with `pif_status = 'active'` / `null` pass into the archived view.

**2. What is actually leaking — two candidates**

- **Candidate A (most likely): `completed` rows look like active items in the UI.** Both `getOptimizedPosts` and the boundary guard treat `pif_status IN ('archived','completed')` as terminal, and the SQL query for the archived scope is `.in('pif_status', ['archived','completed'])`. So the archived view intentionally shows completed rows, but a completed row has no "Arkiverad" visual affordance (`FeedItemList` only badges rows where `status === 'archived' || archived_at`). To the user those look indistinguishable from active items "leaking in".
- **Candidate B: stale React Query cache from a previous archived-scope mount.** `useOptimizedFeed`'s aggregator reads via `queryClient.getQueryData(['posts','optimized', page, includeArchived, feedVersion])`. `gcTime` is 5 min. If a row was archived when previously cached (`status='archived'`) but has since been restored server-side, the cached transformed Post still has `status='archived'` and passes the guard — but that's the opposite direction of the reported bug (an archived-looking row that's actually active).

**3. Cache/unmount behaviour**

- The key-based remount unmounts the old `OptimizedFeedBody`, which unmounts its `useQuery` observer, tears down the realtime channel, and clears in-memory sets/timers. The **React Query cache itself is not cleared on unmount** — entries stay for `gcTime` (5 min) and are reused on remount. That is intentional (fast return-toggles) and is not by itself a leakage source, because entries are scoped by `includeArchived` in the query key.
- `refresh()` calls `clearPostsCache()` (drops `DatabaseCache` + `transformCache`) but does NOT `queryClient.removeQueries(...)`. On a filter toggle we neither call `refresh` nor `removeQueries`, so the archived-scope React Query entry from any earlier archived-view session is served instantly on remount.

### Root-cause hypothesis (to confirm with one diagnostic pass)

The reported "active items appearing" is almost certainly **completed rows** that have no archived styling. Secondary risk: **stale archived-scope RQ cache** entries served before the fresh fetch completes.

### Proposed fix

Two small, additive changes — no behaviour change for active view:

1. **Diagnose first (one-line log, removed after confirmation).** Temporarily log the `id + status + pif_status + archived_at` of the first ~5 items in `fullyFilteredPosts` when `effectiveIncludeArchived` is true. If they are all `completed`, we have Candidate A; if any show `''` / `active`, we have Candidate B.

2. **Fix — regardless of which candidate wins, both are worth addressing:**

   a. **Distinct visual badge for completed rows** in `FeedItemList` — mirror the existing `isArchived` styling with an `isCompleted` variant (localised label, e.g. "Genomförd"). This removes the "looks like an active item" perception.

   b. **Purge the archived-scope React Query cache on `OptimizedFeedBody` unmount** so a stale entry from an older archived session can never render before the fresh fetch:

   ```ts
   useEffect(() => {
     return () => {
       queryClient.removeQueries({
         predicate: (q) =>
           q.queryKey[0] === 'posts' &&
           q.queryKey[1] === 'optimized' &&
           q.queryKey[3] === includeArchived,
       });
     };
   }, [queryClient, includeArchived]);
   ```

   Placed inside `useOptimizedFeed` so it's colocated with the query definition.

   c. **Tighten the guard to also drop cached rows whose transformed `status` disagrees with the current scope** (defence-in-depth, already almost there):

   ```ts
   const s = String((p as any).status ?? (p as any).pif_status ?? '');
   const isTerminal = s === 'archived' || s === 'completed' || !!p.archived_at;
   ```

   (Cast to string prevents any future non-string status from silently passing.)

### Files to touch

- `src/hooks/feed/useOptimizedFeed.ts` — add unmount `removeQueries` for the current scope.
- `src/components/feed/OptimizedFeedContainer.tsx` — tighten `isTerminal`; add temporary diagnostic log (removed after confirmation).
- `src/components/feed/FeedItemList.tsx` — add `isCompleted` visual variant alongside `isArchived`.
- `src/locales/{sv,en}/feed.json` — "Genomförd" / "Completed" label.

### Non-goals

- No change to the SQL filter, network layer, or realtime channel — those are working as of the last fix.
- No change to the outer/inner split — that fix stays.

Approve and I'll implement.
