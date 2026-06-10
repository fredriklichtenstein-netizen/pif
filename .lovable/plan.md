## Goal
Fix the 42501 "Not authorized" errors on `confirm_pif_handoff` and `complete_pif_with_rating` by ensuring the JWT is attached at call time, and add diagnostics to confirm the root cause.

## Background
After the Web Locks bypass in `src/integrations/supabase/client.ts`, the `onAuthStateChange` listener delivers the session synchronously at boot, but some RPCs are firing before/without the session being attached to the request, so `auth.uid()` is `null` server-side.

There is only one Supabase client (`src/integrations/supabase/client.ts`), imported everywhere — so the "secondary client" hypothesis is unlikely. The most plausible cause is an RPC firing in a window where the in-memory session isn't yet attached to the PostgREST request headers.

## Changes

### 1. `src/hooks/usePifCompletion.ts`
Add a small `ensureSession()` helper used before every RPC call (`confirm_pif_handoff`, `complete_pif_with_rating`, `withdraw_pif`):

```ts
const ensureSession = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  const { data: { user } } = await supabase.auth.getUser();
  debugLog("rpc", "pre-RPC auth probe", {
    hasSession: !!session,
    hasAccessToken: !!session?.access_token,
    sessionUserId: session?.user?.id ?? null,
    getUserId: user?.id ?? null,
  });
  return session;
};
```

In each RPC wrapper:
- Call `ensureSession()` first.
- If no session/access_token, log an error, surface a toast ("Du måste vara inloggad"), and return `{ ok: false }` without calling the RPC.
- Otherwise proceed with the existing `supabase.rpc(...)` call (the client will attach the JWT from the now-hydrated session).

### 2. `src/utils/authDebug.ts`
Reuse the existing `debugLog` already wired into the AuthHydrationDebugPanel so the new probes show up in the on-screen debug report. No new infrastructure.

### 3. No changes to `src/integrations/supabase/client.ts`
The Web Locks bypass stays — it solved the boot deadlock. We're only making sure callers wait for hydration before invoking auth-sensitive RPCs.

### 4. No changes to `initializeAuth.ts` / `authStore.ts`
Session storage and listener wiring are correct; the issue is at the RPC call site, not in initialization.

## Verification
1. Hard-refresh `/messages`, open a conversation, tap "Confirm handoff".
2. Debug panel should log: `[rpc] pre-RPC auth probe { hasSession: true, hasAccessToken: true, sessionUserId: <uid>, getUserId: <uid> }` immediately before the RPC.
3. RPC returns success (no 42501).
4. Repeat for "Complete with rating" and "Withdraw".
5. If `hasSession: false` ever appears, we'll know hydration ordering is the real culprit and can gate UI actions on `useAuthReady().isReady` next.

## Out of scope
- Refactoring the auth client.
- Changing RLS policies or RPC SQL.
- Removing the Web Locks bypass.
