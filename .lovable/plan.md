## What I think is happening

The repeated loading hangs look less like one bad `JSON.parse` now and more like an architectural issue: several parts of the app are allowed to block rendering while waiting for auth/session/profile/feed/conversation side effects. When any one of those gets stuck or misses a state transition, the app keeps showing skeletons even though there may be no console error and no visibly pending request.

The biggest risk areas I found:

1. **Global auth can still hold the app hostage**
   - `authStore` starts as `isLoading: true` and `initialized: false`.
   - `PrivateRoute` blocks on `isLoading || !initialized` with no hard timeout.
   - `initializeAuth()` awaits `supabase.auth.getSession()` with no timeout. If the Supabase auth client stalls while synchronously reading/locking storage or restoring a malformed session, protected routes can spin forever.

2. **Root navigation components fetch user data on every page**
   - `MainNav` mounts on most pages and immediately runs profile, notification, unread-message hooks.
   - This means even public pages indirectly start auth-dependent/realtime work during navigation.
   - Those hooks should never be allowed to affect page readiness.

3. **Some page skeletons wait for secondary “nice-to-have” state**
   - Feed waits for posts plus liked/interested hydration before showing content.
   - Messages waits for auth plus conversations.
   - These should render primary content first and hydrate interaction state later.

4. **Suspense fallback can hide import-time failures or slow chunks**
   - Every route is lazy loaded behind one generic loading fallback.
   - If a route chunk import stalls, the user sees the same “loading” UI as if data were loading, making diagnosis hard.

5. **Storage is safer than before, but not completely isolated**
   - More direct `localStorage`/`sessionStorage` calls remain in i18n, version checking, map components, profile/avatar caches, notification filters, and feed distance storage.
   - Most are wrapped in `try/catch`, but root-level access in `i18n/index.ts` still happens during module import and should be fail-safe.

## Recommended strategy: stop trying to find one magic bad line

I would fix this by changing the app’s loading philosophy:

> The shell should always render. Auth, profile, feed, notifications, messages, map, and realtime should be optional layers that either resolve, timeout, or degrade independently.

That makes the app resilient even if the exact underlying stall changes again.

## Plan

### 1. Add a root-level boot safety fuse

Create a tiny `BootSafetyProvider` or root hook that starts a 4–6 second timer when the app mounts.

If auth has not initialized by then, it should:

- mark auth as initialized,
- set loading to false,
- keep `user/session` as whatever is currently known,
- avoid destructive sign-out,
- allow public routes to render,
- allow protected routes to redirect or show a recoverable auth state instead of an infinite spinner.

This is the most important fix. It prevents a single auth restore failure from freezing every refresh.

### 2. Make `initializeAuth()` bounded

Wrap `supabase.auth.getSession()` in a hard timeout, e.g. 4–5 seconds.

On timeout:

- do not keep `isLoading` true,
- set `initialized` true,
- set `profileCompleted` to `null`,
- keep the app usable,
- let later auth-state events repair the session if they arrive.

Also avoid awaiting heavy profile work inside auth initialization before the shell can render. Profile completion can be fetched after session restoration, but should not block the entire app indefinitely.

### 3. Make `PrivateRoute` fail open to a recoverable route state

Replace the permanent private-route spinner with a bounded state:

- show loading briefly while auth initializes,
- after timeout, if no user is known, navigate to `/auth` with the intended destination saved,
- if the user appears later, navigation can continue normally.

This means `/messages`, `/profile`, `/post`, etc. cannot spin forever on refresh.

### 4. Split “app shell” from “data readiness”

The route frame and navigation should render immediately. Expensive or optional data should hydrate after paint.

Specifically:

- `MainNav` should not start notifications/unread/profile realtime work until auth is initialized and user exists.
- Notification/unread hooks should default to `0` and never block navigation.
- Cached profile/avatar should use safe storage only and never subscribe/fetch until there is a stable user id.

### 5. Make feed and messages fail-open

For Feed:

- render posts as soon as posts are available,
- do not block the whole feed on liked/interested hydration,
- hydrate liked/interested buttons later,
- if liked/interested fetches do not resolve within 3–5 seconds, proceed with neutral button state.

For Messages:

- keep the existing conversation timeout but move the timeout down into `useConversations()` too,
- ensure the hook itself sets `isLoading: false` after 5 seconds even if auth/conversation fetch never finishes,
- do not let realtime subscription setup affect first render.

### 6. Add a “safe mode” escape hatch

Add a URL/query/local flag like:

```text
?safe=1
```

When active, it should disable nonessential boot work:

- realtime subscriptions,
- version polling reloads,
- notification/unread counters,
- profile revalidation,
- map auto-initialization,
- feed interaction hydration.

This is an outside-the-box but very practical debugging and recovery tool. If a user is stuck, you can ask them to open `/?safe=1`; if it loads, we know the shell is good and the culprit is one of the disabled side effects.

### 7. Add boot-stage diagnostics without noisy production logs

Since the current failure has no console output, add a tiny in-memory boot timeline that only shows when `?debugBoot=1` is present.

It would record stages like:

```text
main imported
app mounted
i18n initialized
auth init started
auth getSession resolved/timed out
route rendered
nav mounted
feed query started/resolved
```

No regular production `console.log`s. The debug view can be rendered in-page only when explicitly requested.

### 8. Finish storage hardening at root/import boundaries

Apply safe wrappers to the remaining root or route-import storage calls:

- `i18n/index.ts`
- `useVersionCheck.ts`
- `useMapbox.ts`
- `useDistanceFiltering.ts`
- `LanguageSelector.tsx`
- profile/avatar cache writes/removes
- notification filter storage
- map session-state reads/writes

Also improve `safeStorage` so it supports raw string values safely, not only JSON.

### 9. Reduce realtime during initial page load

Realtime subscriptions should start after initial data has rendered, not during first paint.

Examples:

- Feed can load posts first, then subscribe.
- Messages can load conversations first, then subscribe.
- Profile cache can fetch first, then subscribe.
- Nav counters can subscribe after initial auth is stable.

This reduces race conditions and removes realtime as a boot blocker.

### 10. Optional but powerful: build a minimal shell route fallback

If a route stays in Suspense for too long, show a recoverable page instead of the spinner:

- “Sidan tog för lång tid att ladda”
- buttons for “Försök igen”, “Gå till Pifs”, “Starta i säkert läge”

This prevents route chunk/import issues from appearing as infinite loading.

## Technical implementation order

1. Add safe raw storage helpers and update root/import-time storage calls.
2. Add bounded auth initialization timeout.
3. Add `PrivateRoute` timeout fallback.
4. Move nav/profile/notification fetches behind stable auth readiness.
5. Make Feed render independently from liked/interested hydration.
6. Add `useConversations()` internal timeout fallback.
7. Add `?safe=1` mode to disable nonessential side effects.
8. Add `?debugBoot=1` boot timeline for future diagnosis.

## Why this should work even if we have not found the exact culprit

The current problem is dangerous because many unrelated async systems can cause the same symptom: a skeleton that never leaves. This plan removes that class of failure. Even if Supabase auth stalls, storage is corrupt, realtime setup misbehaves, a route chunk is slow, or an interaction-count query hangs, the app shell still renders and the affected feature degrades locally instead of freezing the whole app.