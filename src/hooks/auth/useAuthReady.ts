import { useEffect, useState } from "react";
import { useAuthStore } from "./authStore";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { debugLog } from "@/utils/authDebug";

// Single source of truth for "auth has finished its first restore attempt".
// Returns `{ user, isReady }`. Consumers should gate data fetches on `isReady`
// so they never commit empty/error UI before Supabase has restored the session
// from localStorage on a hard refresh.
//
// `isReady` flips to true when ANY of these happen:
//   1) Demo mode (no Supabase) — immediately.
//   2) supabase.auth.getSession() resolves (success OR error).
//   3) The auth store reports a user/session (e.g. via INITIAL_SESSION listener).
//   4) Hard cap of 6s elapses (fail-open, matches app-wide philosophy).
//
// We do NOT add another onAuthStateChange listener — that's owned by
// initializeAuth(). We only await one getSession() call as a confirmation
// that Supabase's own storage read is done.
export function useAuthReady() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  const [sessionProbeDone, setSessionProbeDone] = useState(false);
  const [capElapsed, setCapElapsed] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) {
      setSessionProbeDone(true);
      return;
    }
    let cancelled = false;
    supabase.auth
      .getSession()
      .then(() => {
        if (!cancelled) setSessionProbeDone(true);
      })
      .catch(() => {
        if (!cancelled) setSessionProbeDone(true);
      });
    const cap = window.setTimeout(() => {
      if (!cancelled) setCapElapsed(true);
    }, 6000);
    return () => {
      cancelled = true;
      window.clearTimeout(cap);
    };
  }, []);

  // Ready when: we have a user already, OR the session probe finished, OR
  // the auth store says it's initialized (and the probe is done too, to avoid
  // the boot-fuse-flipped-initialized-early race), OR the hard cap elapsed.
  const isReady =
    DEMO_MODE ||
    !!user ||
    !!session?.user ||
    (sessionProbeDone && initialized) ||
    sessionProbeDone || // probe alone is enough to know session state
    capElapsed;

  return { user, isReady };
}
