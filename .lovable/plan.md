## Findings

**FAB** (`src/components/feedback/FeedbackFab.tsx:32`)
- Classes: `fixed bottom-24 right-4 z-40 h-14 w-14` → occupies vertical band **96–152px** from the viewport bottom, right-aligned.

**Bottom-right CTAs that collide with it**
- Post/PostEdit forms use `PostFormNavigation.tsx` — a `flex justify-between` row where "Nästa" / "Slutför" / "Publicera" sit right-aligned. On the last step of a mobile form the button ends up in a page with `pb-20` (~80px nav clearance), so the button occupies roughly **80–120px** from the bottom-right corner — directly under the FAB.
- Same pattern in `ProfileEdit.tsx` (`pb-24`) and other form pages.

**MainNav** (`src/components/MainNav.tsx:45`)
- Pill at `bottom-4 sm:bottom-3`, height ~48px → occupies ~**16–64px** from bottom.
- Pages clear it with `pb-20` (80px) or `pb-24` (96px).

**Page bottom-padding that was inflated for the FAB, not the nav**
- `src/pages/Feed.tsx:35` uses `pb-28` (112px). The nav only needs `pb-20`; the extra ~32px was buffer for the FAB. Every other page uses `pb-20`/`pb-24`. This is the one to trim once the FAB moves up.
- No other page adds FAB-specific padding — the FAB is a fixed overlay, so pages don't need to reserve space for it beyond nav clearance.

## Fix

1. **`src/components/feedback/FeedbackFab.tsx`** — change `bottom-24` → `bottom-40` (96px → 160px). New FAB band: 160–216px from bottom, well above any CTA button sitting in the pb-20/pb-24 zone. Also update the doc comment to match.

2. **`src/pages/Feed.tsx`** — reduce `<main className="pb-28">` → `pb-20` to match sibling pages, since the extra padding was there for the old FAB position.

No other pages need padding changes; the FAB is a fixed overlay and the pages already clear the nav correctly.

## Verification

- On `/feed`, `/post`, `/post/edit/:id`, `/profile/edit`, `/account-settings`: at max scroll, tap targets on the bottom-right ("Nästa", "Slutför", form submit) must not sit under the FAB. Check at mobile viewport (390×… dpr 2.5).
- FAB must still clear the MainNav pill and remain reachable one-thumb.
- Build passes.