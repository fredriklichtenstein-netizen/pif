
## The Bug

The map correctly differentiates wishes (amber/star) from pifs (green/gift), but the feed always shows them as green pifs. Root cause: there are TWO separate data paths for posts, and only one normalizes the legacy `'wish'` value to the standard `'request'`.

**Data flow:**

```text
Map view ──► useFetchPosts ──► normalizeItemType(wish→request) ──► ✅ Correct styling
Feed view ──► getOptimizedPosts ──► transform.ts (no normalization) ──► ❌ 'wish' leaks through
```

In `src/services/posts/transform.ts` line 42:
```ts
item_type: item.item_type || 'offer',   // passes 'wish' through unchanged
```

Then every styling check in the card uses `item_type === 'request'`:
- `ItemCardLayout.tsx` (left border color)
- `ItemCardGallery.tsx` (badge color, icon, label)

So any item stored as `'wish'` (legacy DB rows + all mock posts in Demo Mode) silently falls through to the offer/pif branch — green border, green Gift badge.

This matches the project's existing data-normalization memory: legacy `'pif'`/`'wish'` should be normalized to standard `'offer'`/`'request'` at the data layer.

## The Fix

**1. Normalize at the single source of truth** — `src/services/posts/transform.ts`

Replace the passthrough with the same normalization used by `useFetchPosts` and `useMarkerFactory`:
```ts
const rawType = String(item.item_type || 'offer');
const normalizedType: 'offer' | 'request' =
  rawType === 'request' || rawType === 'wish' ? 'request' : 'offer';
// ...
item_type: normalizedType,
```

**2. Fix Demo Mode mock data** — `src/data/mockPosts.ts`

The two posts with `item_type: "wish"` should be `"request"` so they're correct at the source (and so any other consumer that bypasses transforms still gets the right value).

**3. Bust the stale transform cache** — `src/services/posts/optimized.ts`

The transform results are cached by `id + created_at` in `transformCache` (and in `DatabaseCache`). Existing users will still see the old wrong values until cache expires. Bump the cache key (e.g. add a `v2` suffix to `cacheKey` in `getOptimizedPosts` and to the per-item `transform-...` key) so the new normalization takes effect immediately on next load.

**4. Defensive: also normalize at the render boundary** — `src/components/feed/FeedItemCard.tsx`

Add a small inline guard so even if some other path ever feeds raw `'wish'` into a card again, it renders correctly:
```tsx
const normalizedType = post.item_type === 'wish' ? 'request' : post.item_type;
// pass normalizedType to <ItemCard item_type={...} />
```

This belt-and-suspenders approach means the bug can't silently come back.

## Out of Scope (noted, not fixed)

- The 404 on `get_bulk_interaction_counts` and the 1336ms perf warning are unrelated — the code already falls back gracefully. Happy to address separately if you want.

<lov-actions>
<lov-suggestion message="Apply the fix and then verify on /feed end-to-end: confirm wishes show amber border + amber 'Önskning' star badge, and pifs still show green border + green 'Pif' gift badge.">Apply fix and verify in /feed</lov-suggestion>
<lov-suggestion message="Also fix the missing get_bulk_interaction_counts RPC so the feed stops doing the slow fallback queries and the 1336ms api-request warning goes away.">Fix the bulk interaction counts RPC</lov-suggestion>
<lov-suggestion message="Add a lightweight runtime check in dev mode that warns in the console whenever a raw 'wish' or 'pif' value reaches a render boundary, so we catch any future normalization regressions early.">Add dev-mode normalization guard</lov-suggestion>
</lov-actions><lov-plan>

## The Bug

The map correctly differentiates wishes (amber/star) from pifs (green/gift), but the feed always shows them as green pifs. Root cause: there are TWO separate data paths for posts, and only one normalizes the legacy `'wish'` value to the standard `'request'`.

**Data flow:**

```text
Map view ──► useFetchPosts ──► normalizeItemType(wish→request) ──► ✅ Correct styling
Feed view ──► getOptimizedPosts ──► transform.ts (no normalization) ──► ❌ 'wish' leaks through
```

In `src/services/posts/transform.ts` line 42:
```ts
item_type: item.item_type || 'offer',   // passes 'wish' through unchanged
```

Then every styling check in the card uses `item_type === 'request'`:
- `ItemCardLayout.tsx` (left border color)
- `ItemCardGallery.tsx` (badge color, icon, label)

So any item stored as `'wish'` (legacy DB rows + all mock posts in Demo Mode) silently falls through to the offer/pif branch — green border, green Gift badge.

This matches the project's existing data-normalization rule: legacy `'pif'`/`'wish'` should be normalized to standard `'offer'`/`'request'` at the data layer.

## The Fix

**1. Normalize at the single source of truth** — `src/services/posts/transform.ts`

Replace the passthrough with the same normalization used by `useFetchPosts` and `useMarkerFactory`:
```ts
const rawType = String(item.item_type || 'offer');
const normalizedType: 'offer' | 'request' =
  rawType === 'request' || rawType === 'wish' ? 'request' : 'offer';
// ...
item_type: normalizedType,
```

**2. Fix Demo Mode mock data** — `src/data/mockPosts.ts`

The two posts with `item_type: "wish"` should be `"request"` so they're correct at the source.

**3. Bust the stale transform cache** — `src/services/posts/optimized.ts`

Transform results are cached by `id + created_at` in `transformCache` and `DatabaseCache`. Existing users will keep seeing the old wrong values until cache expires. Bump the cache keys (add a `v2` suffix to both the page-level `posts-${limit}-${offset}` key and the per-item `transform-${id}-${created_at}` key) so normalization takes effect on next load.

**4. Defensive: also normalize at the render boundary** — `src/components/feed/FeedItemCard.tsx`

Add a small inline guard so even if any other path ever feeds raw `'wish'` into a card again, it renders correctly:
```tsx
const normalizedType = post.item_type === 'wish' ? 'request' : post.item_type;
// pass to <ItemCard item_type={normalizedType} />
```

Belt-and-suspenders so this bug can't silently come back.

## Out of Scope (noted, not fixed)

- The 404 on `get_bulk_interaction_counts` and the 1336ms perf warning are unrelated — the code already falls back gracefully. Happy to address separately.

