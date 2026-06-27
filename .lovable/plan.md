## Scope

Single file: `src/components/post/interactions/InteractionButtonWithPopup.tsx`. No changes to `CounterButton`, `InterestSelectionList`, `PrimaryActions`, data hooks, RPCs, strings, or non-owner paths. No changes to pif behavior. No changes to wish like-button behavior.

## Change

Relax `ownerViewMode` so wish owners get the same clickable-icon/label + count=0 popover anchor that pif owners already have, but only for the interest button — not likes.

Current (line ~144):
```ts
const ownerViewMode =
  isOwner &&
  (type === "like" || type === "interest") &&
  itemType !== "request";
```

New:
```ts
const ownerViewMode =
  isOwner &&
  (
    (itemType !== "request" && (type === "like" || type === "interest")) ||
    (itemType === "request" && type === "interest")
  );
```

Everything else in the component already does the right thing for wishes once `ownerViewMode` flips true:

- `handleToggleClick` opens the popover; the `type === "like"` prefetch branch is skipped for wish-interest (no prefetch needed — `InterestSelectionList` self-loads).
- The `CounterButton` render gate already includes `ownerViewMode`, so the popover anchor mounts at count=0.
- `CounterButton` already routes `type === "interest" && itemId` to `InterestSelectionList` with `itemType` passed through, so wish-mode (multi-fulfiller) rendering is automatic.
- Icon stays `sparkles` and active color stays amber (`#F59E0B`) via the existing `itemType === "request"` branches — wish visuals unchanged.

## Out of scope (flagged, not implemented)

- Wish-owner like button has the same gap. Not included per your instruction. Easy follow-up if you want it: drop the `itemType !== "request"` guard on the like branch too.
- Non-owner wish "Uppfyller önskan" flow: untouched.

## Verification

- Wish owner, 0 offers: clicking the sparkles icon or "Visa intresse" label opens the popover with `InterestSelectionList`'s empty state. Counter remains hidden (no "0").
- Wish owner, N>0 offers: clicking icon/label opens the same multi-fulfiller selection UI the counter opens today. Existing select/withdraw flows unchanged.
- Wish owner like button: still inert/disabled exactly as today.
- Non-owner wish (any state): Grant Wish dialog, "Uppfyller önskan" perspective label, amber active state — all unchanged.
- Pif owner and non-owner: byte-identical to current behavior.
