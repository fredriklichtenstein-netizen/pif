

## Remove top-right language toggle, move it into Account Settings, and add it to Auth + Create Profile

### 1. Remove the language toggle from `MainHeader`
File: `src/components/layout/MainHeader.tsx`
- Remove the `LanguageSelector` import and usage.
- Keep the header element so layout/spacing stays intact, but render it empty (or reduce to a thin spacer). The header is used on Home, Feed, Map, Post, PostEdit, EmailConfirmation, so we keep the component to avoid touching all of them.

### 2. Add a Language section in `/account-settings`
File: `src/pages/AccountSettings.tsx`
- Inside the existing `account` tab (above or below the Email/Password card), add a new `Card`:
  - Title: `t('settings.language')` ("Språk" / "Language")
  - Description: `t('settings.language_description')` ("Välj appens språk" / "Choose the app language")
  - Content: render `<LanguageSelector />` (the existing dropdown component, reused as-is so behavior stays identical).
- No new tab — keep it inside "Konto" to avoid changing the 4-tab grid layout.

### 3. Add the flag switch to `/auth`
File: `src/pages/Auth.tsx`
- Add a small top-right row above the auth card containing `<LanguageSelector />`, e.g. a `flex justify-end` wrapper inside `max-w-md`. This way unauthenticated users can switch language before signing in/up.

### 4. Add the flag switch to `/create-profile`
File: `src/pages/CreateProfile.tsx`
- Add the same top-right `<LanguageSelector />` placement at the top of the page content so users can switch language during onboarding.

### 5. Translations
Files: `src/locales/en/pages.json` (or `settings`-related file used by AccountSettings) and the Swedish counterpart.
- Add:
  - `settings.language` → "Language" / "Språk"
  - `settings.language_description` → "Choose your preferred app language" / "Välj appens språk"

### Out of scope / non-changes
- `LanguageSelector.tsx` itself is unchanged — same dropdown, same flags, same persistence to `localStorage` and `i18n.changeLanguage`.
- `MainHeader` is not deleted (still used by many pages); only its contents change.
- No new routes, no schema changes.

### Verification
- `/feed`, `/`, `/map`, `/post`, `/post/edit/:id` no longer show the flag in the top-right.
- `/account-settings` → Konto tab shows a new "Språk" card with the working flag dropdown.
- `/auth` and `/create-profile` show the flag dropdown in the top-right of the page content, switching language without reload.

