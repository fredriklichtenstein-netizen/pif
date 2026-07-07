## Lovable implementation plan for approval

### Findings

**NavigationControl registration** (`src/components/map/useMapInitialization.ts:224`):
```ts
newMap.addControl(new mapboxgl.NavigationControl(), "top-right");
```
No offset API is exposed by Mapbox for `addControl` position — offsetting must be done via CSS on the `.mapboxgl-ctrl-top-right` container.

**Filter row layout** (`src/components/map/MapContainer.tsx:220`):
```tsx
<div className="absolute top-4 left-4 right-4 z-20 flex items-center gap-2 ...">
  <div className="... p-1">[type pills — sm buttons]</div>
  <MapFiltersSheet ... />
</div>
```
Measured height: `top-4` (16px) + pill row (~40px button height + 2×4px padding ≈ 48px) ≈ **~64px from viewport top**. On mobile (613px wide viewport), the Filtrera button sits at the right edge, directly over Mapbox's top-right control stack.

### Proposed fix — CSS only, scoped to `.map-container`

Edit `src/components/map/MapStyles.css`. Add, alongside the existing bottom-controls override:

```css
/* Push Mapbox's built-in top-right control stack (zoom + compass)
   below the absolute-positioned filter row (top-4 + ~48px pills =
   ~64px). Applied on all viewports — desktop was also partially
   covered by the Filtrera trigger. */
.map-container .mapboxgl-ctrl-top-right {
  top: 68px !important;
}
```

Rationale for CSS over JS:
- Mapbox's `addControl(control, position)` accepts only fixed position strings; no offset param. Wrapping in a custom container would require replacing the built-in `NavigationControl` mount, adding risk for no visual benefit.
- The scoping selector `.map-container` (set on the wrapper div) ensures the profile page's `AddressMap` and any other map instance is unaffected.
- `68px` clears the pill row (~64px) with a ~4px visual gap matching the existing `bottom: 8px` spacing.
- Applied universally — desktop overlap was also present per the report and this improves it.

### Files touched
- `src/components/map/MapStyles.css` — one appended rule block (~4 lines).

No changes to `MapContainer.tsx`, `useMapInitialization.ts`, or i18n. No filter logic touched.