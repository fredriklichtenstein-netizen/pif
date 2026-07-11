# Top-cutoff follow-up

Investigation confirmed there is **no shared parent** adding space. `#root` is `100dvh`, `App.tsx`'s `<main>` has no styling, and `MainHeader` returns `null`. The three symptoms have three different causes; only Map has a real layout bug.

## 1. Map — real layout bug (top + bottom gap)

`src/pages/Map.tsx` reserves `73px` on `<main>` for a header that no longer renders, and mixes `100vh` with `100dvh` — causing a bottom gap (wrapper `bg-gray-50` shows) and, when Safari's URL bar toggles, a top displacement.

**Change:**
- Replace the outer wrapper on all four render branches (loading, needs-token, error, main) with a **flex column** that fills the viewport:
  - Outer: `flex flex-col min-h-screen-dvh bg-gray-50`
  - `<main>`: `flex-1 relative` (no more `h-[calc(100vh-73px)]`, no more `100vh`)
- Remove the four `<Separator />` elements below the null `<MainHeader />` (they are now meaningless 1px lines above the map).
- Update the stale comment in `src/components/map/MapStyles.css:28` to reflect the new layout.

`MainNav` is `position: fixed`, so it doesn't affect the flex flow — the map fills the full viewport behind it, matching Home/Feed.

## 2. Home — deepen gradient top stop

`src/pages/Home.tsx` outer wrapper:
- `from-green-50` → `from-green-100` (still on-brand, but the top edge now reads as clearly colored instead of near-white).
- Keep `via-background to-blue-50` unchanged.

No structural change; this is a one-token swap.

## 3. Profile — remove top padding

`src/pages/Profile.tsx` main render branch outer wrapper:
- `py-8 px-2` → `pt-4 pb-8 px-2` (shrinks the near-white band above the Card from 32px to 16px so the card sits close to the viewport top).
- Loading and auth-required branches are already `flex items-center justify-center` — leave them.

## Files touched

- `src/pages/Map.tsx` — 4 branches: outer wrapper → `flex flex-col min-h-screen-dvh bg-gray-50`; `<main>` → `flex-1 relative ...`; remove `<Separator />` (4x).
- `src/components/map/MapStyles.css` — update comment referring to the old calc offset.
- `src/pages/Home.tsx` — `from-green-50` → `from-green-100`.
- `src/pages/Profile.tsx` — main branch wrapper `py-8` → `pt-4 pb-8`.

## Out of scope

- `MainHeader` stays as `return null` (confirmed intentional).
- No changes to `App.tsx`, `#root`, safe-area utilities, or the viewport meta — those are already correct.
- Other pages still using `min-h-screen` (ShareRedirect, ResetPassword, Privacy, PostEdit, Post, EmailConfirmation, NotFound, AccountSettings) remain untouched per earlier agreement.
