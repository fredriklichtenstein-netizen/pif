# Bug: post-deletion redirect lands on sign-in page

## Location
`src/components/settings/DangerZone.tsx`, line 44 (inside `handleDeleteAccount`).

## Root cause
After `delete_own_account` RPC + `supabase.auth.signOut()`, the toast says "Omdirigerar till startsidan…" (Redirecting to home page), but the code calls:

```ts
navigate("/auth");
```

That sends the (now unauthenticated) user straight to the sign-in page — exactly what the user is seeing. The redirect isn't missing and there's no race; it just points to the wrong route.

The public landing page is `/` (`Home`, registered in `src/routes/routeConfig.tsx` line 66). It's wrapped in `OnboardingGate`, which explicitly passes unauthenticated visitors through (`src/components/auth/OnboardingGate.tsx` only redirects when `user && !profileCompleted`). So an unauthenticated user hitting `/` sees the public landing page, matching the toast copy and the desired behavior.

## Fix

Change line 44 from:

```ts
navigate("/auth");
```

to:

```ts
navigate("/", { replace: true });
```

`replace: true` prevents the settings page (which the user no longer has access to) from remaining in browser history.

## Scope
- One-line change in `src/components/settings/DangerZone.tsx`.
- No locale, routing, RPC, or auth-logic changes.
- Toast copy (SV "Omdirigerar till startsidan…" / EN "Redirecting to home page…") is already correct.
