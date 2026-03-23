

## Problem

The `/auth` page is permanently stuck loading because:

1. **`authStore` starts with `isLoading: true`** (line 27 of authStore.ts)
2. **`initializeAuth()` is only called from `PrivateRoute`** — it is never called when visiting `/auth` directly
3. Since `initializeAuth` never runs, `isLoading` stays `true` and `initialized` stays `false`
4. There IS a 3-second safety timeout in `useAuth.tsx`, but it only sets a local `authTimeout` state — it doesn't actually call `setLoading(false)` or `setInitialized(true)` on the store, so other consumers of the store (like `useGlobalAuth` in Auth.tsx) still see `isLoading: true`

## Fix (2 changes)

### 1. Call `initializeAuth` from the Auth page
In `src/pages/Auth.tsx`, import and call `initializeAuth` on mount — just like `PrivateRoute` does. This ensures the store resolves its loading state whether the user lands on `/auth` or a private route.

### 2. Reduce the store's initial timeout
In `src/hooks/auth/initializeAuth.ts`, the outer timeout is 10 seconds and the Promise.race timeout is 8 seconds. These are too long. Reduce them to 5s and 4s respectively so users aren't waiting forever if Supabase is unreachable.

### Technical details

**Auth.tsx** — add useEffect:
```typescript
import { initializeAuth } from "@/hooks/useGlobalAuth";

useEffect(() => {
  initializeAuth();
}, []);
```

**initializeAuth.ts** — reduce timeouts from 10s/8s to 5s/4s.

This ensures that when a user visits `/auth`:
- `initializeAuth` runs immediately
- If Supabase responds, `isLoading` becomes `false` quickly
- If Supabase is unreachable, the 5s timeout resolves it
- The existing 3s safety timeout in `useAuth.tsx` acts as a final fallback

