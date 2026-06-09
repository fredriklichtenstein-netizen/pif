# Fix: Messages & Notifications empty after hard refresh

## Root cause (summary)
On hard refresh, `useNotifications` and `useConversations` run their fetch logic before Supabase has finished restoring the session from localStorage. They each commit an empty/error UI immediately when `user` is `null`, and an internal 5-second safety timer flips `isLoading=false` regardless of whether auth is still hydrating. Once empty is rendered, the user sees "No messages/No notifications" even though the session restores moments later. Normal navigation works because `user` is already hydrated by then.

## Approach
Introduce a single source of truth for "the auth session has finished its first restore attempt" (`useAuthReady`) and gate the two hooks on it. Stop committing empty/error state while auth is still hydrating. Keep all existing safety timeouts as a final fallback, but only after `authReady` is true.

## Changes

### 1. New hook: `src/hooks/auth/useAuthReady.ts`
Returns `{ user, isReady }` where `isReady` becomes true once **either**:
- `useAuthStore.initialized === true` AND the boot fuse hasn't fired prematurely (we check by also waiting for a one-shot `supabase.auth.getSession()` resolution on mount, capped at 6s), OR
- the internal cap elapses (fail-open, matches existing app-wide fail-open philosophy).

This hook does NOT add a second listener — it reads from the existing `useAuthStore` and additionally awaits one `getSession()` call to confirm Supabase's own storage read is done before flipping `isReady`.

### 2. `src/hooks/useNotifications.ts`
- Replace `useGlobalAuth()` with `useAuthReady()`.
- In `fetchNotifications`, when `!isReady`, **return without setting state** (no empty commit, keep skeleton).
- When `isReady && !user?.id`, set `[]` + `isLoading=false` (genuine signed-out empty state).
- Move the 5s internal safety timer so it only starts after `isReady` becomes true, not on mount.
- Add `isReady` to the effect deps and to `fetchNotifications`'s `useCallback` deps so the fetch re-runs exactly once when auth finishes restoring.

### 3. `src/hooks/useConversations.ts`
- Same swap to `useAuthReady()`.
- In the fetch function, gate the "must sign in" error branch behind `isReady` — only set that error when auth has truly finished restoring AND there's no user.
- Move the 5s internal safety timer to start after `isReady`.
- Add `isReady` to the effect deps.

### 4. `src/pages/Messages.tsx`
- Compute `isLoading` from `!authReady || conversationsLoading` (with the existing 5s `loadingTimedOut` fallback unchanged) so the skeleton stays up while auth is hydrating instead of flipping to "No conversations".

### Files NOT changed
- `initializeAuth.ts` — its background retry already hydrates `user` correctly; the bug is in the consumers, not the producer.
- Boot safety fuse, PrivateRoute, App.tsx — keep as-is.
- Realtime subscriptions, BroadcastChannel sync, mark-as-read — untouched.

## Verification
- Hard refresh `/messages` while signed in → skeleton shows until session restores, then real conversation list (not "No conversations").
- Hard refresh `/` while signed in → notifications badge populates; opening notifications shows real list.
- Hard refresh `/messages` while signed out → after auth resolves, "must sign in" error appears (unchanged).
- Hard refresh with throttled network → skeleton holds for up to ~6s then fails open to empty state (no infinite spinner).
- Navigation between pages (the path that already worked) continues to work — `isReady` is already true on subsequent mounts.
