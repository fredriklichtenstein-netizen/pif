## Lovable implementation plan for approval

### FIX 1 — Type pill needs 2–3 taps (root cause)

**Root cause:** race between async cluster init and viewport marker rendering.

Flow on filter change:
1. Tap → `setSelectedItemTypes` → `finalFilteredPosts` recomputed → new `posts` array passed to `MapMarkersLayer`.
2. `useClusterInit` fires an **async** effect (`Promise.all(addLocationPrivacy)` per post), then eventually assigns `enhancedPostsRef.current = enhancedPosts`, rebuilds `clusterIndexRef.current`, and calls `setMapReady(true)`.
3. In parallel, `useViewportMarkers`' effect re-runs (because `MapContainer` re-created `guarded(onPostClick)`, making `createPostMarker` a new callback → `updateMarkers` new → effect re-binds). It calls `updateMarkers()` **synchronously**, reading the still-stale `enhancedPostsRef.current` + previous `clusterIndexRef.current` → renders the OLD marker set.
4. When the async cluster init finally finishes, nothing notifies React. `mapReady` was already `true`, so `setMapReady(true)` is a no-op. `enhancedPostsRef` / `clusterIndexRef` are refs (mutations don't trigger renders). No `moveend` / `zoomend` fires. So markers stay stale.
5. On the next tap, the render cycle *happens* to run `updateMarkers` while the previous tap's async work has completed → user sees the previous tap's result. Hence "2–3 taps".

**Proposed fix (in `useClusterInit.ts` + `useViewportMarkers.ts`):**
- Add a `clusterVersion` counter (either lift a `useState` in `MapMarkersLayer` and pass down, or expose it from `useClusterInit`'s return).
- At the very end of `initializeClusters()` — after `clusterIndexRef.current.load(features)` and `enhancedPostsRef.current = enhancedPosts` — increment `clusterVersion`.
- Include `clusterVersion` in `useViewportMarkers`' `updateMarkers` `useCallback` deps (and the outer `useEffect` deps) so it re-runs and repaints markers exactly once the new cluster index is ready.
- Guard against stale async: capture a local `cancelled` flag in `useClusterInit`'s effect cleanup so an in-flight run doesn't overwrite refs for a newer posts array.

Minimal diff shape (illustrative, not final):

```ts
// MapMarkersLayer.tsx
const [clusterVersion, setClusterVersion] = useState(0);
useClusterInit({ ..., setClusterVersion });
useViewportMarkers({ ..., clusterVersion });
```

```ts
// useClusterInit.ts (inside initializeClusters, at end)
if (!cancelled) {
  enhancedPostsRef.current = enhancedPosts;
  clusterIndexRef.current = index;
  setMapReady(true);
  setClusterVersion(v => v + 1);
}
```

```ts
// useViewportMarkers.ts
const updateMarkers = useCallback(() => { ... }, [..., clusterVersion]);
```

No behavior change to filters, RPCs, or the store — this is purely a render-timing fix on the marker layer.

---

### FIX 2 — "Piffar" active state text invisible (proposed diff)

**File:** `src/components/map/MapContainer.tsx` (the three pill buttons around lines 219–252).

Cause: pill buttons use `variant="ghost"` on shadcn `Button`, whose base ruleset includes `hover:text-accent-foreground`. On touch devices the `:hover` state sticks after tap, so `text-white` gets overridden by `text-accent-foreground` while the button retains hover — producing near-invisible text on the green/amber active background. Also, the inactive `text-teal-700` momentarily coexists with the active `bg-teal-600` if any Tailwind class-order oddity applies.

Fix: on the active branch, also lock `hover:text-white` and `focus:text-white` so no state can override. Apply the same to the Önskningar active branch.

Proposed change (Piffar):
```tsx
selectedItemTypes.length === 1 && selectedItemTypes.includes("offer")
  ? "bg-teal-600 hover:bg-teal-700 text-white hover:text-white focus:text-white"
  : "hover:bg-teal-50 text-teal-700"
```

Proposed change (Önskningar):
```tsx
selectedItemTypes.length === 1 && selectedItemTypes.includes("request")
  ? "bg-amber-500 hover:bg-amber-600 text-white hover:text-white focus:text-white"
  : "hover:bg-amber-50 text-amber-700"
```

"Alla" already uses `text-primary-foreground` and doesn't have this issue — no change.

---

### FIX 3 — Filter count badge overflows viewport on mobile (proposed diff)

**File:** `src/components/map/MapFiltersSheet.tsx` (lines 117–132).

Cause: badge is rendered inline (`ml-2`) inside the "Filtrera" button, so its width adds to the button's layout width. Combined with the wide pill group and `right-4` container inset on narrow viewports, the button extends past the screen edge.

Fix: render the badge as an absolutely-positioned corner overlay on the button (the button already has `relative`), so button width no longer depends on the badge.

Proposed change:
```tsx
<Button
  variant="outline"
  size="sm"
  className="bg-background shadow-md hover:bg-accent relative h-9"
>
  <SlidersHorizontal className="h-4 w-4 mr-2" />
  {t("interactions.filter_label", "Filtrera")}
  {hasActive && (
    <Badge
      variant="secondary"
      className="absolute -top-2 -right-2 h-5 min-w-5 px-1 flex items-center justify-center text-xs rounded-full shadow-sm"
    >
      {activeCount}
    </Badge>
  )}
</Button>
```

The badge visually sits on the top-right corner of the button. Button width is unaffected → no overflow. The parent row's `right-4` inset is enough to keep the corner badge on-screen; if further safety is desired, we can nudge to `-top-1.5 -right-1.5`.

---

### Scope

Only `src/components/map/MapContainer.tsx`, `src/components/map/MapFiltersSheet.tsx`, `src/components/map/MapMarkersLayer.tsx`, `src/components/map/markers/useClusterInit.ts`, and `src/components/map/markers/useViewportMarkers.ts`. No i18n, backend, filter-store, or public API changes.
