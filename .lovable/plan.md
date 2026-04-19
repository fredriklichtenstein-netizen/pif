

## Diagnosis

Supercluster is configured with `maxZoom: 16` in `useClusterInit.ts`. This means clustering is **active** at zoom levels 0–16 and points only individualize at zoom 17+. Combined with the cluster-click handler in `useMarkerFactory.ts` capping the fly-to zoom at `Math.min(expansionZoom, 16)`, any cluster whose `getClusterExpansionZoom` returns ≥17 (which happens easily when privacy-offset points land within the 60px cluster radius of each other at high zooms) becomes **permanently un-expandable**: clicking it flies to zoom 16, where the cluster still exists.

The screenshots confirm this: clusters of "3" and "4" stay clustered at maximum zoom, and clicks don't break them apart.

## Fix

### `src/components/map/markers/useClusterInit.ts`
Lower Supercluster `maxZoom` from `16` → `14`. At zoom 15+, every point renders individually. This matches typical map UX: at city-block zoom, neighbors should always see individual pins.

### `src/components/map/markers/useMarkerFactory.ts`
Raise the cluster-click zoom cap from `Math.min(expansionZoom, 16)` → `Math.min(expansionZoom, 17)` and add a small `+0.5` nudge so the fly-to lands just past the cluster's break-up threshold. This guarantees a single click always fully expands a cluster.

### Why these two values together
- `maxZoom: 14` ensures clustering never persists at street-level zoom.
- The click cap of 17 leaves room for `getClusterExpansionZoom` to return 15 (one past `maxZoom`) and still get a clean fly-to.

### Out of scope
- Reducing the cluster `radius` (60px is fine for finger-friendly tap targets).
- Touching the privacy-offset randomization (the offset is intentional and clustering should adapt to it, not the other way around).

