/**
 * Boot safety fuse.
 *
 * Started once from main/App. If auth has not initialized within
 * BOOT_TIMEOUT_MS, force the auth store into an initialized + not-loading
 * state so the app shell can always render. We deliberately do NOT clear
 * the user/session — if a real session is restored later the UI heals.
 *
 * This is the single most important regression guard: no matter what
 * async step gets stuck during boot, the UI cannot be skeletonized forever.
 */

import { useAuthStore } from "@/hooks/auth/authStore";

const BOOT_TIMEOUT_MS = 5000;

let started = false;

export function startBootSafetyFuse(): void {
  if (started) return;
  started = true;
  if (typeof window === "undefined") return;

  window.setTimeout(() => {
    try {
      const s = useAuthStore.getState();
      if (s.initialized && !s.isLoading) return;
      // Fail open: app shell renders, protected routes can redirect, public
      // routes work anonymously. A later onAuthStateChange or successful
      // getSession will still populate the user normally.
      if (s.isLoading) s.setLoading(false);
      if (!s.initialized) s.setInitialized(true);
      // eslint-disable-next-line no-console
      console.warn("[boot] Safety fuse tripped — forcing auth initialized so the UI can render.");
    } catch (err) {
      // eslint-disable-next-line no-console
      console.warn("[boot] Safety fuse error", err);
    }
  }, BOOT_TIMEOUT_MS);
}
