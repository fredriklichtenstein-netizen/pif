

## Diagnosis

Two distinct issues, both visible in the screenshot.

### Issue 1 — Console flooded with `swedish_urban_areas` 404s

In `src/utils/location/privacyOffset.ts` line 32, `isUrbanArea(lat, lng)` is called **without forwarding the `map` instance**. Without `map`, the function in `src/utils/location/urbanDetection.ts` (line 12) skips infrastructure-based detection and immediately falls through to `fallbackToDatabaseCheck`, which queries a `swedish_urban_areas` table that does not exist in this project. Result: one 404 + console error per post (×9 = 18 errors), every map render.

The DB fallback is dead code from an older architecture. With Mapbox infrastructure detection available (already implemented in the same file), the database lookup is never the right answer here.

### Issue 2 — Pins stacked under the filter chip

The pins ARE rendering — the screenshot shows a cluster (blue) and a single Wish marker (heart) at the top-left, partially occluded by the "Alla (9)" filter chip. Two causes:

1. `useClusterInit.ts` `fitBounds` uses `padding: { top: 80, ... }` which is not enough clearance for the filter overlay, which sits at the top with significant height plus the demo banner above it (≈48px banner + filter row).
2. With only one or two distinct privacy-offset locations in the test data, `fitBounds` zooms aggressively and the result lands flush against the top edge.

## Fix

### `src/utils/location/urbanDetection.ts`
Remove the `swedish_urban_areas` database fallback entirely. Replace `fallbackToDatabaseCheck` with a safe default: when infrastructure data is unavailable, return `false` (treat as rural → larger 800m offset, the more privacy-preserving choice). Drop the unused Supabase import.

### `src/utils/location/privacyOffset.ts`
Forward the `map` parameter to `isUrbanArea(lat, lng, undefined, map)` so infrastructure detection actually runs when a map is provided.

### `src/components/map/markers/useClusterInit.ts`
Increase `fitBounds` top padding from `80` → `160` to clear the demo-mode banner + filter chip stack. Also lower `maxZoom` from `14` → `13` so when only 1–2 distinct locations exist, the view stays a touch wider and pins aren't pinned to one corner.

### Out of scope
- Creating the `swedish_urban_areas` table (not needed; Mapbox infrastructure detection is the intended approach).
- Touching the filter chip layout — padding fix is sufficient.
- Removing the `console.error` inside `isUrbanArea`'s catch — it stays for genuine Mapbox query errors.

