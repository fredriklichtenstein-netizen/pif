

## Diagnosis

The console logs prove the **submission is correct**: coordinates `{lat, lng}` and `item_type: "request"` reach the database. Both bugs are downstream, in how posts are read back and transformed for display.

### Bug 1 — Wish badge shows "Pif"
`src/hooks/feed/useFetchPosts.ts` (lines 98-117) transforms Supabase rows but **omits `item_type` from the output object**. Every post arrives at the UI with `item_type === undefined`, and the badge component falls back to `'offer'` (Pif). The mock-data path includes it correctly; the live-DB path does not.

### Bug 2 — No map pins
Same hook (line 106) passes `coordinates: item.coordinates` as the **raw PostGIS string `"(lng,lat)"`** straight from Supabase. `MapMarkersLayer` (lines 134-138) expects `{lng: number, lat: number}` and filters out anything that isn't numeric — so all 9 real posts get dropped before clustering. The filter chip says "Alla (9)" because that count comes from the post array length, but `validPosts` inside the markers layer is empty.

### Bug 3 — `ping` 404
`src/components/map/useMapInitialization.ts` (line 82) calls `https://api.mapbox.com/v1/ping`, an endpoint that doesn't exist. It's a no-op connectivity probe; the 404 is harmless but pollutes the console.

## Fix

**`src/hooks/feed/useFetchPosts.ts`** — in the live-fetch transform (lines 98-117):
- Add `item_type: normalizeItemType(item.item_type)` to the returned object.
- Parse coordinates with `parseCoordinatesFromDB(item.coordinates)` so the result is `{lat, lng}` (or `null`) instead of a raw string.
- Also pass `pif_status` through (already aliased to `status`, leave as-is).

**`src/components/map/useMapInitialization.ts`** — replace the `api.mapbox.com/v1/ping` connectivity check with a HEAD request to `https://api.mapbox.com/styles/v1/mapbox/streets-v11?access_token=…` (a real endpoint), or simply remove the pre-check and let map init surface real errors. Removing is simpler and matches the "no noisy console" rule.

### Out of scope
- Refactoring the parallel `services/posts/transform.ts` path (it already parses coordinates correctly; only `useFetchPosts` is broken).
- Touching submission code — logs confirm it's correct.

