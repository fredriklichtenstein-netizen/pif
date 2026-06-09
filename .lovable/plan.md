## What's happening

The console errors tell two different stories:

1. **`WebSocket ... closed due to suspension`** — Safari/WebKit pauses background-tab WebSockets. This is benign noise from Supabase Realtime; it's not what's breaking the UI.
2. **`502 trackevents`** — Lovable's analytics pixel. Unrelated to app data.

The actual bugs are state bugs from the boot-safety changes we added previously:

### Bug A — Notifications stuck in "loading"
`useNotifications.fetchNotifications` short-circuits when `user?.id` is falsy and **never sets `isLoading` to `false`**. After the boot safety fuse forces `initialized=true` with no user (because `getSession()` raced out in 4s), the notifications hook sits at `isLoading: true` forever.

### Bug B — Messages shows empty UI on signed-in users
`initializeAuth` uses `Promise.race(getSession(), 4s timeout)`. When the race times out we mark the store `initialized: true` but never retry, so `user` stays `null` for the rest of the session even though the session exists in localStorage. `useConversations` then takes the `!authLoading && !user` branch ("must sign in") and renders an empty/empty-error state. The 5s safety just flips `isLoading` off on top of that empty state.

The `onAuthStateChange` `INITIAL_SESSION` event would normally rescue this, but if the underlying GoTrue storage lock is what stalled `getSession`, the listener fires late or not at all and nothing re-attempts the read.

## Fix plan

1. **`src/hooks/auth/initializeAuth.ts`** — when `getSession()` times out, don't give up. Kick off a background, non-racing retry (`supabase.auth.getSession()` + simple 30s polling backoff, stopping as soon as a session or `SIGNED_IN`/`INITIAL_SESSION` event arrives) that hydrates `authStore.user/session` when storage finally responds. UI stays unblocked (fuse already flipped `initialized`), but a real signed-in user will populate within a second or two instead of never.

2. **`src/hooks/useNotifications.ts`**
   - In `fetchNotifications`, when `!user?.id`, set `notifications: []` and `isLoading: false` before returning.
   - Add the same 5s internal safety timeout used in `useConversations` so the badge/list can never sit on a skeleton forever, even on cold loads where auth is still resolving.
   - Leave the existing realtime/recovery logic untouched.

3. **`src/hooks/useConversations.ts`** — once Fix 1 lands, signed-in users will get `user` populated and the normal fetch path runs. No structural change needed; just confirm the existing 5s safety still renders the empty state cleanly when the user truly is anonymous.

4. **Leave WebSocket suspension + 502 trackevents alone.** They're not the cause; touching realtime config now would just add risk.

## Verification

- Reload `/` while signed in → notifications badge populates, no perpetual skeleton.
- Reload `/messages` while signed in → conversation list renders (not "must sign in").
- Reload `/messages` while signed out → still redirects to `/auth` via `PrivateRoute`.
- Reload `/notifications` cold with throttled network → list either shows data or empty state within ≤5s, never an infinite skeleton.

## Out of scope

- Changing realtime transport, analytics pixel, or any of the previously approved boot-safety / safeStorage work.
