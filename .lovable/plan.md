# Fix: Supabase Web Locks deadlock causing hung queries on hard refresh

## Root cause
On hard refresh, `supabase.auth.getSession()` never resolves (timed out at 4s, never returned at 10s+). Every subsequent authenticated query — including `supabase.from('notifications').select(...)` and the `get_user_conversation_ids` RPC — also hangs, because `supabase-js` calls `getSession()` internally on each request to attach the JWT and inherits the same stuck lock.

Meanwhile, `onAuthStateChange: SIGNED_IN { hasSession: true, hasUser: true }` fires at **9ms** — the session is already in localStorage and the listener delivers it synchronously. The listener path is uncontaminated by the lock.

This is the well-documented `@supabase/auth-js` `navigator.locks` deadlock that affects certain Safari / PWA / iOS WebKit contexts.

## Approach
Two complementary fixes:

1. **Replace the lock with a no-op** in the supabase client config so `getSession()` and JWT-attach can never deadlock again. This is the official supported escape hatch (`auth.lock` option). The trade-off — cross-tab token-refresh races — is negligible for this app (`autoRefreshToken` still works; in the rare case two tabs refresh simultaneously the second just gets a fresh token).

2. **Stop awaiting `getSession()` in the boot path**. The listener already delivers the session at 9ms; awaiting `getSession()` is redundant and was the symptom that surfaced the deadlock. After fix #1, `getSession()` works again, but we no longer need to block the UI on it — the listener is the source of truth.

## Changes

### 1. `src/integrations/supabase/client.ts`
- Add `lock: async (_name, _acquireTimeout, fn) => fn()` to the `auth` options. This bypasses `navigator.locks` entirely while preserving every other behavior (persist, autoRefresh, PKCE, detectSessionInUrl).
- Keep the existing `storageKey` and storage config unchanged.

### 2. `src/hooks/auth/initializeAuth.ts`
- Register the `onAuthStateChange` listener first (already done).
- Still call `supabase.auth.getSession()` with the 4s race, but treat the listener-delivered session as authoritative: if `INITIAL_SESSION` / `SIGNED_IN` populates the store before `getSession()` resolves, mark `initialized: true` and skip the redundant work.
- Keep the existing background retry as a final safety net.

### 3. `src/hooks/auth/useAuthReady.ts`
- Drop the manual `supabase.auth.getSession()` probe (no longer needed and was multiplying the deadlock).
- Make `isReady` derive purely from the auth store: `DEMO_MODE || !!user || !!session?.user || initialized || capElapsed`.
- Keep the 6s fail-open cap as a final safety net.

### Files NOT changed
- `useNotifications.ts`, `useConversations.ts`, `Messages.tsx`, `App.tsx`, boot fuse, `PrivateRoute` — all already correct; they were starved by the wedged client, not buggy themselves.
- Existing debug logging — keep, useful for verification.

## Verification (via the debug panel)
- Hard refresh `/messages` while signed in:
  - `onAuthStateChange: SIGNED_IN` at <50ms (same as today).
  - `getSession() resolved { hasUser: true }` within ~100ms (previously: never).
  - `[notifications] query returned { rows: N }` within ~500ms (previously: never).
  - `[conversations] RPC returned { count: N }` within ~500ms (previously: never).
  - UI shows real lists, not "No conversations / No notifications".
- Hard refresh `/` while signed in: notifications badge populates within ~500ms.
- Signed-out hard refresh: PrivateRoute redirects to `/auth` as before.
- Cross-tab sign-out still propagates (handled by `onAuthStateChange`, not by the lock).

## Technical reference
- Supabase issue tracker context: `supabase-js` v2 uses `navigator.locks` to serialize token refresh across tabs. In some WebKit contexts a lock acquired during the initial `getSession()` is never released, deadlocking every subsequent auth call. The supported escape hatch is passing a custom `lock` function in `auth` config.
