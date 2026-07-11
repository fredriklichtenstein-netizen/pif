## Fix: Map broken due to indefinite container height

### Root cause
Mapbox needs a definite computed height at init. The flex chain uses `min-h-screen-dvh` + `flex-1`, but `PullToRefresh` wraps `<main>` and may not propagate a definite height, and `MapContainer`'s inner element likely relies on `h-full` which resolves against an indefinite ancestor → 0px → "invalid dimensions".

### Fix (Map only)

1. **`src/index.css`** — add a fixed-height utility:
   ```css
   .h-screen-dvh { height: 100vh; height: 100dvh; }
   ```

2. **`src/pages/Map.tsx`** — main render branch (line 156): change outer wrapper to `h-screen-dvh overflow-hidden` (fixed height), keep `flex flex-col`. Leave error/loading branches on `min-h-screen-dvh` (they don't host the map).

3. **`src/pages/Map.tsx`** — ensure the height chain into Mapbox is definite:
   - `<main className="relative flex-1 min-h-0">` (add `min-h-0` so flex child can shrink and take real height inside `overflow-hidden` parent)
   - Verify `PullToRefresh` className `flex-1 flex flex-col` — also add `min-h-0` there.

4. **Defense-in-depth**: quickly inspect `src/components/map/MapContainer.tsx` (not yet read) to confirm its root has `h-full w-full`. If not, add it. Also confirm `useMapInitialization.ts` — I saw `trackResize: true`, but add a `requestAnimationFrame(() => map.resize())` after load as a safety net if container measured 0 initially.

5. **CSS controls offset** in `MapStyles.css` already correct — no change.

### Home/Profile perceived gap (lower priority, after Map verified)
Ask user for a fresh screenshot after Map fix. If gap persists:
- Home: the top of the gradient may still read as near-white on iOS; consider `from-primary/10` or a solid tint band instead of `from-green-100`.
- Profile: check whether `bg-gray-50` on `<body>`/`#root` vs the profile wrapper causes a visible seam at the notch; may need `bg-gray-50` on `body` too, or push profile background to full-bleed.

### Rollback option
If step 2 doesn't restore the map within one iteration, revert Map wrapper to the pre-flex layout (`min-h-screen-dvh` with `<main className="relative h-[calc(100dvh-0px)]">`) — MainHeader returns null so no offset is needed; the previous `100vh` breakage was cosmetic on mobile chrome, not blocking.
