

## Diagnosis

The "Ta foto" button code is technically correct — both inputs use `capture` attributes:
- Profile avatar: `capture="user"` (front camera)
- Post images: `capture="environment"` (rear camera)

**Root cause: the `capture` attribute is silently ignored on desktop browsers.** On Chrome/Safari/Firefox desktop, `<input type="file" capture="...">` falls back to the normal file picker — making "Ta foto" indistinguishable from "Välj bild". The current preview viewport (861×904) is desktop-sized, which is why both buttons behave identically.

On a real mobile device (iOS Safari, Android Chrome), `capture` *does* open the camera — but only if the browser/OS supports it and the user grants permission. In some mobile browsers (e.g. Firefox mobile, in-app webviews like Instagram/Facebook browser), `capture` is also ignored.

A secondary issue: the camera `<input>` doesn't reset its `value` between clicks, so re-selecting the same photo wouldn't fire `onChange`. Worth fixing while we're here.

## Plan

### 1. Make desktop behavior explicit
On desktop, hide the "Ta foto" button entirely (since it's the same as "Välj bild") OR show a tooltip/help text explaining it only works on mobile. **Recommendation: hide on desktop** — cleaner UX, matches user expectations.

- Add a small `useIsMobile`-style check (project already has `src/hooks/use-mobile.tsx` based on Tailwind conventions — verify and reuse).
- In `UploadOptions.tsx` and `ImageUploadArea.tsx`: only render the "Ta foto" button when `isMobile === true`.

### 2. Fix the value-reset bug (mobile)
When the camera input is clicked, reset `event.target.value = ''` first so re-capturing the same photo still fires `onChange`. Apply to both camera inputs.

### 3. Verify mobile detection works
Confirm `src/hooks/use-mobile.tsx` exists and uses a viewport breakpoint (typically <768px). If not, create a lightweight detector based on `navigator.userAgent` + viewport width — pure UA sniffing is unreliable so combine both.

### Files to edit
- `src/components/profile/UploadOptions.tsx` — gate "Ta foto" behind `isMobile`
- `src/components/profile/AvatarUpload.tsx` — reset `value` on the hidden camera input click
- `src/components/post/form/images/ImageUploadArea.tsx` — gate "Ta foto" behind `isMobile`, reset `value`

### Out of scope
- Building a full custom camera UI with `getUserMedia` (heavier, requires permissions UI, video stream handling) — only worth it if the user wants in-browser desktop camera capture. Can be a follow-up.

