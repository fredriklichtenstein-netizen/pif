Force-complete override is missing from STATE 1's popover — only Undo is wired. Adding it before verification.

## What's missing

`AwaitingConfirmationPopover` already supports `onHardComplete` and renders "Markera som klar ändå" when it's set. But neither call site (`PostModal.tsx`, `InterestSelectionList.tsx`) passes the prop, so the override button never appears.

## Mechanism to reuse

The piffer's existing rating-then-complete path is already invoked from `ConversationView.tsx:405` via `completion.completeWithRating(rating, comment)` — the same RPC the messaging banner uses, which completes the pif server-side even if the receiver hasn't confirmed. The shared dialog that collects rating+comment and calls that RPC is `PifferRatingDialog` (already imported and used by both call sites for the auto-open path).

So "force-complete" doesn't need a new RPC — it just needs to open `PifferRatingDialog` from the popover.

## Changes

### 1. `src/components/profile/PostModal.tsx`
Pass `onHardComplete` to the awaiting popover that opens the existing `PifferRatingDialog` with the existing `ratingContext` shape:

```tsx
onHardComplete={() => {
  setRatingContext({ receiverName: receiverName || t('common.user') });
  setRatingOpen(true);
}}
```

No new state, no new RPC wiring — `PifferRatingDialog` already calls `completeWithRating` internally and the existing realtime/cache plumbing handles the rest (item leaves feed → archived view, verified earlier).

### 2. `src/components/post/interactions/interest/InterestSelectionList.tsx`
Same pattern — pass `onHardComplete` that opens the already-mounted `PifferRatingDialog` for the selected helper row. Reuses the same shared `usePifCompletion` instance.

### 3. i18n (already present)
Keys `interactions.awaiting_hard_complete_btn` ("Markera som klar ändå") and `interactions.awaiting_finish_btn` ("Slutför och betygsätt") already exist in both `sv` and `en` from the previous turn — no locale changes needed.

## Out of scope

- No RPC changes (`confirm_pif_handoff` / `complete_pif_with_rating` stay untouched, per the standing rule from earlier this session).
- No feed/archive filter changes (Group A verified clean).
- No new states — STATE 1 popover gains the override button; STATE 2 (Sparkles "Genomför pifen") already routes to the same dialog via `awaiting_finish_btn`.

## Verification after implementation

1. Owner clicks "Markera som uppfylld" → amber pill appears
2. Open popover → see BOTH "Markera som klar ändå" (primary) AND "Ångra bekräftelse" (ghost)
3. Click "Markera som klar ändå" → `PifferRatingDialog` opens immediately (no waiting for the other party)
4. Submit rating → item completes, leaves feed, lands in `ArchivedPifsGrid`
5. Repeat for a wish via `InterestSelectionList`
6. Separately confirm the unforced path still works: receiver confirms in messaging → Sparkles state → rating dialog auto-opens
