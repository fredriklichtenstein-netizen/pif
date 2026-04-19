
## Diagnosis

At zoom 14 (now Supercluster's `maxZoom`), 3 points are clustered. At zoom 15+, Supercluster returns each point individually — but visually they render at the **same pixel** because the privacy-offset coordinates land within ~1–2 meters of each other (or are literally identical when the same source location feeds multiple posts). All three markers stack on top of each other, so the user sees "1 pin" where there were "3."

Two contributing factors:
1. **Coordinate cache collisions**: `coordinateCache` in `src/utils/location/coordinateCache.ts` keys by source `lng,lat`. If multiple posts share the same source address (e.g., same user's home), they all get the **same** offset coordinate → perfect overlap.
2. **Tight randomization**: Even with unique source coords, the 300m urban offset can land neighbors within a meter of each other.

The cluster count of "3" was honest; the single visible pin at max zoom is a stack, not a missing pin.

## Fix

### `src/utils/location/coordinateCache.ts`
Stop caching by source coordinate alone. Either:
- **(A)** Remove caching entirely — privacy offsets are cheap and per-post randomness is desirable, OR
- **(B)** Key the cache by `postId` (requires plumbing postId through `addLocationPrivacy`).

Recommend **(A)**: simpler, removes the collision class entirely, and the offset computation is trivial (one `Math.random` + trig). Cache hits weren't saving meaningful work.

### `src/utils/location/privacyOffset.ts`
Remove `getCachedCoordinates` / `cacheCoordinates` calls. Each call now produces a fresh independent offset, so two posts at the same source address land at two distinct points.

### `src/components/map/markers/useClusterInit.ts`
Add a tiny **jitter** (e.g. ±2 meters, ~0.00002°) on top of the privacy offset before feeding points into Supercluster. This guarantees that even if two offsets coincidentally land at the same coordinate, they render as two separate pins at max zoom rather than stacking. Cheap insurance.

### Why both
- Removing the cache fixes the dominant cause (shared source addresses).
- Jitter handles the rare random collision and any future caching reintroduction.

### Out of scope
- Changing privacy radius (300m urban / 800m rural stays).
- Spiderfier-style stack-fanning UI (overkill for v1; jitter is enough).
- Supercluster `radius` or `maxZoom` retuning (current values are correct).
