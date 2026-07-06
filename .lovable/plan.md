## Root cause

Both inputs are the shadcn `Textarea` (`src/components/ui/textarea.tsx`), used by:

- **Feed comments** → `src/components/comments/CommentInput.tsx` (rendered by `LazyCommentsSection` → `CommentsPanel`)
- **Messages** → `src/components/messaging/EnhancedMessageInput.tsx`

`Textarea` has `text-sm` (14px). **iOS Safari auto-zooms into any form field whose computed font-size is < 16px on focus.** That zoom is what the user perceives as "the viewport expanding horizontally beyond the screen" — the page stays laid out at 390 CSS px, but Safari scales it up, which produces horizontal panning/scrolling until the field is blurred.

Contributing factor: the app has no global `overflow-x: hidden` on `html/body`, so any transient overflow (from the zoom or from a wide child) is scrollable rather than clipped.

The viewport meta tag (`index.html` line 6) is correct and should NOT be changed to `maximum-scale=1, user-scalable=no` — that fixes the symptom but breaks pinch-zoom accessibility (WCAG 1.4.4). The right fix is to make the input font ≥ 16px on mobile.

## Fix

1. **`src/components/ui/textarea.tsx`** — change `text-sm` to `text-base md:text-sm`. Keeps the desktop look, prevents iOS zoom on mobile. This is the standard shadcn-on-iOS fix and applies everywhere `Textarea` is used (comment input, message input, rating comment, report dialog, etc.).

2. **`src/components/ui/input.tsx`** — same change (`text-base md:text-sm`) for consistency, so single-line inputs elsewhere in the app (auth, profile edit, search) don't hit the same bug.

3. **`src/index.css`** — add a safety net on the root:
   ```css
   html, body { overflow-x: hidden; }
   ```
   Belt-and-braces guard against any other wide child causing horizontal scroll on mobile.

## Verification

- Preview `/feed`, expand a post's comments, tap the comment field → page must not zoom or gain a horizontal scrollbar.
- Preview `/messages`, open a conversation, tap the message field → same expectation.
- Desktop view unchanged (still `text-sm`).
- Build passes.

No business-logic changes; purely presentational.