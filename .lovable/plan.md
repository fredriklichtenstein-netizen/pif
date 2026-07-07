## Map page — three layout fixes (no filter logic changes)

### Fix 1 — Filtrera button overlapping Mapbox zoom/compass
Move the `Filtrera` sheet trigger from the top-right slot into the same top-left inline group as the type pills (Alla / Piffar / Önskningar). Top-right is then fully free for Mapbox's built-in `NavigationControl`. Viewport is wide enough (613px) that pills + trigger fit comfortably on one row.

**File:** `src/components/map/MapContainer.tsx`
- Collapse the current two-column `flex … gap-2` top row into a single left-aligned pill+trigger group.
- Remove the empty right-side pointer-events wrapper.

### Fix 2 — Bottom Mapbox controls floating too high
Root cause: `map.setPadding()` only affects camera math, not DOM control positions. The real problem is a stale CSS offset. In `Map.tsx` the map lives inside `<main className="h-[calc(100vh-73px)]">` with `MainNav` as a sibling **below** it — the map-container's own `bottom: 0` is already flush above MainNav. The current `bottom: 68px !important` override pushes controls a further 68px up into the map area.

**Files:**
- `src/components/map/MapStyles.css` — change `.map-container .mapboxgl-ctrl-bottom-left/right { bottom: 68px }` → `bottom: 8px` (small breathing gap only).
- `src/components/map/MapContainer.tsx` — change the custom Locate button wrapper from `bottom-20` (80px) → `bottom-4` (16px) so it sits just above the scale/logo strip instead of mid-map.
- Leave `map.setPadding({ bottom: 80 })` untouched — it correctly reserves camera space for programmatic `flyTo`/`fitBounds`; it is not the layout lever.

### Fix 3 — Copy: "Mitt intresse" → "Mina visade intressen" (map only)
`feed.my_interest` is shared with `FeedFiltersPanel.tsx` and `OptimizedFeedContainer.tsx`. Renaming it would change the label on `/feed` as well, which is out of scope. Instead, introduce a map-scoped key.

**Files:**
- `src/locales/sv/map.json` — add `"only_my_interest": "Mina visade intressen"`.
- `src/locales/en/map.json` — add `"only_my_interest": "Interests I've shown"`.
- `src/components/map/MapFiltersSheet.tsx` — swap the one label from `t("feed.my_interest", …)` to `t("map.only_my_interest", …)`. No active-filter badge renders this text (badge shows a numeric count only), so this single swap covers every visible occurrence on the map page.

### Out of scope
No filter logic, no state-shape changes, no changes to `FeedFiltersPanel`, no changes to `NavigationControl`/`ScaleControl` registration.
