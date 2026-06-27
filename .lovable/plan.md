## Surface coverage (confirmed)

Traced every mount of `PrimaryActions` / `InteractionButtonWithPopup` back to the hook that owns `handleShowInterest`. There are exactly two render paths, and only two:

```text
Feed (FeedItemCard) ─┐
ArchivedPifsGrid     ├─► item/ItemCard ─► ItemCardWrapper ─► useItemCardWrapper  (already wraps w/ confirm — pif only)
ItemDetail page      ─┘                                       └─► useItemCard

Profile PostModal ──────► post/ItemCard ─► ItemCardContainer ─► useItemCardContainer  (NOT wrapped — one-tap bug here)
                                                                 └─► useItemCard
```

No third surface mounts these buttons for an active interest/offer. `ItemDetailContainer` renders `ItemCardWrapper` internally, so it inherits the wrapped path. Nothing else consumes `handleShowInterest` from `useItemCard` / `useItemDetailPage` and pipes it into `PrimaryActions`.

So full coverage = make both `useItemCardWrapper` and `useItemCardContainer` go through the shared hook.

## Plan

### 1. New shared hook: `src/hooks/item/useWithdrawInterestConfirm.ts`

Single source of truth for the confirm-wrap and the dialog state.

Inputs:
- `showInterest: boolean` — current state (true = user has an active interest/offer)
- `handleShowInterest: (note?: string) => void` — raw toggle from `useItemCard`
- `itemType?: 'offer' | 'request'` — drives copy

Returns:
- `handleShowInterestWithConfirm(note?)` — call site replacement
- `withdrawConfirmOpen`, `setWithdrawConfirmOpen`
- `confirmWithdrawInterest()`
- `withdrawCopy: { title, description, cancel, confirm }` — resolved i18n strings, item-type aware

Behavior: if `showInterest` is true, intercept and open the dialog. Otherwise pass through (adding interest stays one-tap). On confirm, call raw toggle and close.

### 2. Shared confirm dialog component: `src/components/item/WithdrawInterestDialog.tsx`

Thin `AlertDialog` that takes `open`, `onOpenChange`, `onConfirm`, and the `withdrawCopy` object. Both wrappers render it — no inline duplication of dialog markup either.

### 3. Wire into both surfaces

- `src/components/item/hooks/useItemCardWrapper.tsx`: delete the inline `withdrawConfirmOpen`/`handleShowInterestWithConfirm`/`confirmWithdrawInterest` block. Replace with the shared hook. Pass `item_type` through (already available on props — thread it in via the hook's props).
- `src/components/item/ItemCardWrapper.tsx`: pass `item_type` into `useItemCardWrapper`; replace inline `AlertDialog` JSX with `<WithdrawInterestDialog ... />`.
- `src/components/post/card/useItemCardContainer.ts`: accept `item_type` prop, wrap `handleShowInterest` via the shared hook, expose the same dialog state + copy.
- `src/components/post/ItemCardContainer.tsx`: pass `item_type` into the hook and render `<WithdrawInterestDialog ... />` alongside the existing card.

### 4. Item-type-aware copy (sv + en)

Add to `interactions.json`. Keep existing pif keys; add wish variants.

- `withdraw_interest_title` / `withdraw_interest_description` / `withdraw_interest_cancel` / `withdraw_interest_confirm` — unchanged (pif/offer path).
- New for `item_type === 'request'`:
  - `withdraw_offer_title`: "Är du säker på att du vill dra tillbaka ditt erbjudande?"
  - `withdraw_offer_description`: "Önskaren kommer inte längre se ditt erbjudande att uppfylla önskan."
  - `withdraw_offer_cancel`: "Avbryt"
  - `withdraw_offer_confirm`: "Dra tillbaka erbjudandet"
  - English equivalents.

The shared hook resolves the key set based on `itemType`.

### 5. Out of scope (per your call)

- Counter → `InterestSelectionList` → "Ångra" path keeps its single-click behavior. No second AlertDialog added there.
- Owner-side / selection / withdraw-fulfiller flows untouched.

### Technical notes

- Shared hook keeps the existing semantics exactly: `showInterest === true` ⇒ dialog; `false` ⇒ immediate toggle. No behavior change on the pif feed surface; only PostModal/ItemCardContainer gains parity, and wish surfaces gain item-type-correct copy.
- `WithdrawInterestDialog` is presentational only; no business logic, no data fetching.
- Translation lookup: prefer a single `t(itemType === 'request' ? 'interactions.withdraw_offer_*' : 'interactions.withdraw_interest_*')` resolution inside the hook so both surfaces render identical strings.

### Verification

- Trigger withdraw on a pif from Feed → dialog opens, confirm withdraws. (regression check)
- Trigger withdraw on a pif from PostModal → dialog now opens (previously one-tap). 
- Trigger withdraw on a wish from Feed and PostModal → dialog opens with offer-specific copy.
- Add interest/offer (first tap) → no dialog, stays one-tap on both surfaces.
