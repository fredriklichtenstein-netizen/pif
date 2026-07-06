## Lovable implementation plan for approval

### Root cause

All four feed action buttons (Gillar, Kommentera, Dela, Uppfyll önskan) render through the same `InteractionButtonWithPopup` component. Its label + counter row is:

```tsx
<div className="flex flex-row items-center justify-center mt-1 gap-1.5">
  <span className="text-xs font-medium ...">{labelText}</span>
  {count > 0 && <CounterButton ... />}
</div>
```

The `<span>` has no `whitespace-nowrap`. The other three labels are single words ("Gillar", "Kommentera", "Dela") so they never wrap. "Uppfyll önskan" contains a space, so on narrow flex columns the browser breaks it into two lines. Once the span wraps, three things happen at once:

1. Two lines of text (issue #1).
2. Wrapped text inside a span defaults to `text-align: left`, so the two lines look left-aligned (issue #2).
3. The wrapped span grows to fill available width, pushing the `CounterButton` to the far right of the row (issue #3).

So all three symptoms are the same bug: the label is allowed to wrap.

### Fix

Two small changes, both scoped to presentation:

1. **`src/components/post/interactions/InteractionButtonWithPopup.tsx`** (line 279)
   Add `whitespace-nowrap` to the label span so no action label ever wraps:
   ```
   className={`text-xs font-medium select-none whitespace-nowrap ${disabledClass} ${dimClass}`}
   ```
   This alone fixes issues #2 and #3 for any label, and prevents future regressions if any other label grows.

2. **Shorten the Swedish copy** so "Uppfyll" fits comfortably next to the counter on 360–390px screens (the "Önskan" badge on the wish card already provides context):
   - `src/locales/sv/interactions.json` → `"grant_wish": "Uppfyll önskan"` → `"grant_wish": "Uppfyll"`
   - Leave English `"grant_wish": "Grant wish"` unchanged (fits on one line with `whitespace-nowrap`; parallel to "Comment"/"Share" length).
   - Do **not** touch the perspective label `fulfilling_wish` ("Uppfyller önskan") — that only shows once the user is a selected fulfiller and by then the counter is hidden, so wrapping isn't a concern; but the new `whitespace-nowrap` still protects it.

### Out of scope

- No changes to `CounterButton`, icon sizing, or the outer `flex-1 min-w-[60px]` column.
- No changes to the other three buttons; they already look correct and inherit the `whitespace-nowrap` safety.
- No copy change for the offer variant ("Intresserad") — single word, already fine.
