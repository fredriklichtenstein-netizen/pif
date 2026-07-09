## Goal
Prove which of three hypotheses explains why the correct `headerTitle` is computed but not visible: (a) commit-phase mismatch, (b) a second `InterestSelectionList` instance, (c) DOM staleness.

## Why no code fix yet
The render path in `src/components/post/interactions/interest/InterestSelectionList.tsx` (lines 699-845) has no memoization, no `React.memo`, no `useMemo`, no portal caching, and the parent already forces a fresh mount via `key={showPopup ? "open" : "closed"}` in `CounterButton`. If the reported logs are accurate, React must be committing the "selected" JSX. Adding a fix now would be a shot in the dark.

## Diagnostic step 1 — instance id + commit-phase log
In `InterestSelectionList.tsx`:
- Generate a stable `instanceId` via `useRef(Math.random().toString(36).slice(2,7))` and include it in every existing `console.log`. This will show if two instances are interleaving.
- Add a `useEffect` that runs on every render (no dep array) and logs `[fulfiller-self-view:committed]` with `{ instanceId, isFulfillerView, isSelectedFulfiller, headerTitleShown: document.querySelector('[data-testid="fulfiller-header"]')?.textContent, hasMessageBtn: !!document.querySelector('[data-testid="fulfiller-message-btn"]') }`. This runs AFTER commit, so it reports what actually reached the DOM.
- Add `data-testid="fulfiller-header"` to the `<h3>` at line 789 and `data-testid="fulfiller-message-btn"` to the Meddelande `<Button>` at line 817.

## Diagnostic step 2 — reproduce & report
User reopens item 33's popup as Fredrik and copies the console output covering both `[InterestSelectionList v3] render` entries and the new `[fulfiller-self-view:committed]` entries.

The committed-phase log tells us definitively:
- If `headerTitleShown` = the selected copy → the DOM IS correct and the user was reading stale visuals; we're done.
- If `headerTitleShown` = the pending copy while `isSelectedFulfiller` is `true` → React is committing the wrong branch, which would point to a Radix/portal bug and justify a structural rework (e.g. splitting the fulfiller-self view into its own component keyed by `isSelectedFulfiller`).
- If two different `instanceId`s appear → there's a duplicate mount and we fix the caller, not this file.

## Files touched
- `src/components/post/interactions/interest/InterestSelectionList.tsx` — diagnostics only.

## Cleanup
Once the root cause is identified in the next turn, remove all `[fulfiller-self-view:*]`, `[InterestSelectionList v3]`, `[InterestSelectionList] mounted/fetch …` logs and the `data-testid` attributes.
