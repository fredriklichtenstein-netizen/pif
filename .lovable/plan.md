## Goal

Fix the layout breakage in `InterestSelectionList.tsx` where a selected pif receiver's row truncates the user's name to "F.." and wraps the timestamp onto multiple lines, caused by the recently-added "Ångra" button competing for space with the existing "Vald" badge and "Meddelande" button inside a 320px-wide popover.

## Root cause

- Popover: `w-80` (320px).
- Row: `flex flex-wrap items-center gap-2`, with the user Link as `flex-1 min-w-0` (left side) and the actions cluster as `ml-auto flex flex-wrap` (right side).
- Actions for a selected pif receiver now contain three elements: "Vald" badge (~55px) + "Ångra" labeled button (~75px) + "Meddelande" labeled button (~95px) + gaps ≈ 235px. Plus 28px avatar → Link gets squeezed to ~30–40px, forcing name truncation and timestamp wrap.
- The actions row's own `flex-wrap` doesn't trigger because the actions still fit; the Link side is what gets crushed.

## Change

In `src/components/post/interactions/interest/InterestSelectionList.tsx`, inside the `!isOwner && currentUserId === r.user_id` branch (the block added in the previous turn, ~lines 974–987), convert the "Ångra" button to icon-only:

- Replace its label text with just the `<UserMinus />` icon (no `mr-1`).
- Use `size="icon"` with `className="h-7 w-7 text-destructive hover:text-destructive"` to keep the dense row scale.
- Preserve accessibility via `aria-label={t("interactions.withdraw_offer_btn", "Ångra")}` and add `title={t("interactions.withdraw_offer_btn", "Ångra")}` for hover tooltip parity.
- Keep `onClick={handleWithdrawOwnOffer}` unchanged.

Leave the "Meddelande" button immediately after it fully untouched (text + icon), since it's the primary CTA and benefits from the explicit label.

## Out of scope

- The owner-side withdraw button above (different branch, not affected).
- The wish-side collapsed fulfiller view (no overflow there).
- Any SQL, the `withdrawPreSelectionInterest` helper, the server-authoritative routing, the `isSelectedFulfiller` header copy logic, or any other branch in the file.
- No CSS token changes, no popover width change.

## Verification

- Typecheck.
- Visual check at 320px popover width (the failing case from the screenshot): name renders full, timestamp on one line, both buttons fit beside the "Vald" badge.
- Functional re-test: clicking the icon-only Ångra still triggers `handleWithdrawOwnOffer` → server-authoritative `withdraw_receiver` for the pif receiver case.

## Technical details

File: `src/components/post/interactions/interest/InterestSelectionList.tsx`
Lines affected: ~977–984 (the `<Button>` immediately inside the `!isOwner && currentUserId === r.user_id && (<>` fragment).
Diff shape:

```tsx
<Button
  size="icon"
  variant="outline"
  className="h-7 w-7 text-destructive hover:text-destructive"
  onClick={handleWithdrawOwnOffer}
  aria-label={t("interactions.withdraw_offer_btn", "Ångra")}
  title={t("interactions.withdraw_offer_btn", "Ångra")}
>
  <UserMinus className="h-3 w-3" />
</Button>
```

No new translation keys (reuses `interactions.withdraw_offer_btn`). No new imports (`UserMinus` already imported).
