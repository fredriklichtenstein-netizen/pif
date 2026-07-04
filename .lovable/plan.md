## Fix: Exclude Radix dialog overlay from html2canvas capture

### Problem
The dark Radix `DialogOverlay` (`bg-black/80`) is rendered in the DOM alongside `DialogContent` inside `DialogPortal`. The current `ignoreElements` predicate in `FeedbackDialog.tsx` only excludes `[data-feedback-dialog]` (the content wrapper), so the fixed-position backdrop is still captured in screenshots.

### Changes
1. **`src/components/ui/dialog.tsx`** — Add `data-radix-dialog-overlay=""` to the `DialogPrimitive.Overlay` component so the overlay can be targeted explicitly.
2. **`src/components/feedback/FeedbackDialog.tsx`** — Extend the `ignoreElements` predicate to also exclude any element matching `[data-radix-dialog-overlay]`:
   ```text
   ignoreElements: (el) =>
     el instanceof HTMLElement &&
     (el.closest("[data-feedback-dialog]") !== null ||
      el.closest("[data-radix-dialog-overlay]") !== null),
   ```
3. Run `tsgo` / typecheck to confirm no regressions.

No other files need changes. This fix is scoped to the html2canvas call only.