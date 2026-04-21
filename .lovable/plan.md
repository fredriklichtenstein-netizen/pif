

## Map: First-load center on PIF address, star marker for wishes, simplified popups, fix off-screen controls

### 1. Center on user's PIF address on first map visit per session

**Files:** `src/components/map/useMapInitialization.ts`, `src/components/map/MapContainer.tsx`

- Add a session flag `sessionStorage.getItem('map_session_initialized')`. If absent, the first map mount in this browser session should ignore the persisted `localStorage` state and instead center on the user's PIF address.
- In `MapContainer`, call `usePifAddress()` to get `coordinates`. After `isMapReady` becomes true:
  - If session flag is missing AND PIF coordinates are available → `map.flyTo({ center: [lng, lat], zoom: 14 })` (skip animation, use `jumpTo` to avoid a visible swing on first paint).
  - Set `sessionStorage.setItem('map_session_initialized', '1')`.
- Subsequent navigations (Feed → Map within same session) keep using the existing `localStorage`-persisted center/zoom from `useMapInitialization` (`saveMapState` on `moveend` already handles this). No change needed to that path.
- Fallback chain: PIF address → existing `localStorage` state → Stockholm default.

### 2. Replace `?` with star icon on wish markers

**File:** `src/components/map/MapMarkerElement.tsx`

- In `createElementTemplate`, the `icon.innerHTML` for `request` is currently `'?'`. Replace with a filled star glyph (`'★'`) so it visually matches the wish styling used in the feed (amber star). Pif marker keeps `'♥'`.

### 3. Simplify map popups to image-only with type icon overlay

**File:** `src/components/map/MapPopup.tsx`

- Strip the popup down to a single square thumbnail with rounded corners and a small overlay icon indicating type:
  - Container: 160×160px square, `border-radius: 16px`, soft shadow, white background.
  - Image: `object-fit: cover`, fills the square. If no image, show a soft gradient (existing fallback) with the central icon.
  - Overlay: small circular badge in the top-left corner showing the type symbol only — gift icon (🎁) for pifs, star (★) for wishes — colored to match (`#0D9488` / `#F59E0B`). No text label, no title, no description, no category, no condition, no distance, no "Klicka för detaljer" CTA.
- Click target: the popup (or marker click, which already handles routing) still triggers navigation to the post in feed. Hover on marker continues to open the popup as today.
- Remove now-unused helpers (`getDistanceText`, `getItemTypeLabel`, `condition`, `category`, distance imports) from this file.

### 4. Map control buttons off-screen on shorter viewports

**Files:** `src/components/map/MapContainer.tsx`, `src/pages/Map.tsx` (verify), `src/components/map/MapStyles.css` (only if needed for Mapbox built-in controls)

- Root cause: the location button is positioned `absolute bottom-4 right-4` inside the map area. The page layout reserves only `h-[calc(100vh-73px)]` for the map but the global `MainNav` is a fixed bottom bar (~64–80px), so the bottom strip of the map (and the button) is covered by MainNav on shorter viewports.
- Fixes:
  - Change the location button wrapper from `bottom-4` to `bottom-20` (i.e. ~80px above the MainNav) — and on `sm:` breakpoints keep it at `sm:bottom-4` if MainNav is hidden on larger screens (verify in `MainNav` component; if MainNav is always visible, keep `bottom-20` everywhere).
  - Move the Mapbox built-in `NavigationControl` (added in `useMapInitialization` at `top-right`) to avoid colliding with the demo-mode banner / loading badge — keep at `top-right` but ensure the demo banner/loading toast stays narrow and centered (already the case).
  - Move the Mapbox `ScaleControl` from `bottom-left` to `top-left` *or* offset it via CSS in `MapStyles.css` (`.mapboxgl-ctrl-bottom-left { bottom: 80px !important; }`) so it isn't hidden by `MainNav`.
  - Apply the same `bottom-80px` offset rule to `.mapboxgl-ctrl-bottom-right` for safety.

### Verification

- Open `/feed` then `/map` in a fresh tab → map centers on the user's PIF address (or Stockholm if no PIF address).
- Pan/zoom away, navigate `/map → /feed → /map` → map returns to the panned position (session persistence works).
- Wish pins show a star; pif pins show a heart.
- Hovering or clicking any pin shows only a square rounded thumbnail with the type icon badge in the corner.
- On a 360×800 viewport (Map page), the "my location" button and the Mapbox scale bar are fully visible above the bottom MainNav.

### Out of scope

- No changes to clustering logic, filter UI, distance rings, or marker animations.
- No DB or schema changes.
- Marker hover/click handlers, popup positioning anchor, and routing remain identical.

