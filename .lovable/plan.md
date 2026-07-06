## Lovable implementation plan for approval

### Findings

**Bullet 1 — gates are already correct.**
- `OnboardingGate` (src/components/auth/OnboardingGate.tsx:24) only checks `!profileCompleted`.
- `PrivateRoute` (src/components/auth/PrivateRoute.tsx:61) only checks `!profileCompleted`.
- `profileCompleted` in the store is populated from `profile.onboarding_completed` in `initializeAuth.ts` (`applyProfileCompletion`, lines 21–43) — it is a direct mirror of the DB flag, no other fields feed into it.
- `useSignIn.handleSuccessfulSignIn` (src/hooks/auth/useSignIn.tsx:112) also only checks `profile.onboarding_completed`.

So the routing/gate layer is not what's re-showing onboarding. No changes needed there.

**Bullet 2 — CreateProfile does NOT short-circuit on `onboarding_completed = true`. This is the bug.**

In `src/pages/CreateProfile.tsx` the prefill effect (lines 63–128):

1. Loads the profile including `onboarding_completed`.
2. Computes `hasName / hasAvatar / hasAddress` from the raw field values.
3. Silent-completes ONLY when `hasName && hasAvatar && hasAddress && !profile?.onboarding_completed` (line 105).
4. Otherwise falls through to the step-resume block (lines 118–121), which unconditionally sets `step` to 1/2/3 and renders the wizard — even if `onboarding_completed === true`.

Consequence: any already-onboarded user who lands on `/create-profile` for any reason (stale link, sign-in race where `fetchProfileWithRetry` returned `null` and `useSignIn` fell back to `/create-profile`, a lingering redirect, etc.) is shown Step 3 pre-filled with their data, because e.g. `hasAvatar` or `hasAddress` is derived as falsy from a missing local field even though the DB flag says they're done.

Since `onboarding_completed = true` is the single source of truth, CreateProfile must honor it before evaluating anything else.

### Fix

Edit `src/pages/CreateProfile.tsx` prefill effect only. Presentation-layer change, no routing/gate/store changes.

Immediately after fetching the profile, add a short-circuit as the very first branch:

```ts
if (profile?.onboarding_completed === true) {
  // Keep the global store in sync in case it drifted, then leave without
  // rendering any wizard step.
  useAuthStore.getState().setProfileCompleted(true);
  navigate("/", { replace: true });
  return;
}
```

This runs before any `setFirstName / setStep / setPrefillLoading(false)` calls, so no wizard step ever renders for a completed user. `prefillLoading` stays `true` during the redirect, so the component shows only the existing spinner — never Step 3.

The existing silent-completion branch (all mandatory fields present but flag not yet set) and the resume-at-missing-step branch remain unchanged for genuinely unonboarded users.

No other files change. No changes to `OnboardingGate`, `PrivateRoute`, `useSignIn`, `initializeAuth`, or the auth store.
