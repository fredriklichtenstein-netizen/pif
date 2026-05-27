## Goal

Bring the same pifs/wishes and category filtering from `/map` to `/feed`, and keep both views in sync so a change in one is immediately reflected in the other (and persists across reloads, like today).

Distance / "my location" / "my pif address" already works on the feed and stays untouched.

## Approach

Today the map owns the filter state in local React state inside `MapContainer.tsx`, persisted to `localStorage` via `loadMapFilters` / `saveMapFilters`. The feed has no item-type or category filter UI at all (its `FeedFilters.tsx` is unused inside `OptimizedFeedContainer.tsx`).

We lift that state into a small shared store so both pages read and write the same source of truth.

### 1. Shared filter store

Create `src/stores/feedFiltersStore.ts` (Zustand, matches the existing `refreshSyncStore` pattern):

- State: `selectedCategories: string[]`, `selectedConditions: string[]`, `selectedItemTypes: string[]`, `onlyInterested: boolean`.
- Initialized from `loadMapFilters()` so existing saved selections carry over.
- Every setter (`setCategories`, `setConditions`, `setItemTypes`, `setOnlyInterested`, `clearAll`) calls `saveMapFilters(...)` so persistence stays identical (same `localStorage` key, same versioning/migration).
- A `window.addEventListener('storage', ...)` listener rehydrates the store when the key changes in another tab — gives true cross-tab sync for free.

Rename the storage helper from `mapFiltersStorage.ts` to `feedFiltersStorage.ts` (keep the same `STORAGE_KEY = "map_filters"` so no migration is needed) and update the two import sites. Optional: keep a re-export shim to avoid touching unrelated code.

### 2. Refactor MapContainer

In `src/components/map/MapContainer.tsx`:

- Remove the four `useState` calls for categories/conditions/itemTypes/onlyInterested and the `useEffect` that calls `saveMapFilters`.
- Read values + setters from `useFeedFiltersStore(...)`.
- `handleClearFilters` becomes `clearAll()` from the store (plus the existing `setSelectedDistance(null)`, which stays local since distance is location-dependent and not shared with the feed list).
- No other changes to map behavior.

### 3. Feed filter UI

Extract the pifs/wishes pill bar + categories dropdown from `MapFilters.tsx` into a reusable presentational component `src/components/filters/PostTypeAndCategoryFilters.tsx` (props: counts, selected values, change handlers, `variant: "map" | "feed"` to tweak styling — map keeps its floating shadow card, feed uses an inline bar above the list).

- `MapFilters.tsx` keeps composing this component + the distance card + the "only interested" toggle + the active-filter chips, so the map UI is visually unchanged.
- On the feed, render the same component above the `FeedItemList` inside `OptimizedFeedContainer.tsx`.

The condition checkbox group and "only interested" toggle stay map-only for v1 (the user explicitly scoped this to pifs/wishes + categories). Because the store still holds those values, they remain in sync if set from the map.

### 4. Apply filters in the feed

In `OptimizedFeedContainer.tsx`:

- Read `selectedCategories`, `selectedItemTypes`, `selectedConditions`, `onlyInterested` from the shared store.
- Use the existing `useMyInterestedIds` hook (already used by the map) to gate `onlyInterested`.
- Apply the same filter predicate that lives in `MapContainer` (item type, category, condition, interested) on top of the existing `useDistanceFiltering` output. Factor it into a tiny `applyPostFilters(posts, filters, interestedIds)` helper in `src/utils/postFilters.ts` so the map and the feed call exactly the same function — guarantees the two views always agree on what passes.
- Update the empty-state / clear-filters wiring so `clearFilters` calls `clearAll()` from the store and the existing distance reset.

### 5. Sync semantics

- Same-tab sync: both pages subscribe to the Zustand store, so any change re-renders the other view immediately if it's mounted (and is applied next time it mounts otherwise).
- Cross-tab sync: the `storage` event listener in the store rehydrates from `loadMapFilters()` whenever the key changes.
- Persistence: unchanged behavior, same `localStorage` key.

## Files touched

- New: `src/stores/feedFiltersStore.ts`
- New: `src/components/filters/PostTypeAndCategoryFilters.tsx`
- New: `src/utils/postFilters.ts`
- Renamed (or shim): `src/utils/mapFiltersStorage.ts` → `src/utils/feedFiltersStorage.ts`
- Edited: `src/components/map/MapContainer.tsx` (state → store)
- Edited: `src/components/map/MapFilters.tsx` (compose the new shared sub-component)
- Edited: `src/components/feed/OptimizedFeedContainer.tsx` (render filters + apply predicate)

## Out of scope

- No backend / RPC / SQL changes — filtering stays client-side, identical to today's map behavior.
- No change to distance / location / pif-address controls.
- No change to the existing `FeedFilters.tsx` view-mode tabs (saved / my pifs / archived / interested) — they're unused in the current feed container and stay that way.
