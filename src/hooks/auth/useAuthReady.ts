import { useEffect, useState } from "react";
import { useAuthStore } from "./authStore";
import { DEMO_MODE } from "@/config/demoMode";
import { debugLog } from "@/utils/authDebug";

// Single source of truth for "auth has finished its first restore attempt".
// Derives purely from the auth store (which is populated by the
// onAuthStateChange listener and initializeAuth) — never calls
// supabase.auth.getSession() itself, since that path can deadlock in some
// WebKit contexts. A 6s hard cap stays as a fail-open safety net.
export function useAuthReady() {
  const user = useAuthStore((s) => s.user);
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  const [capElapsed, setCapElapsed] = useState(false);

  useEffect(() => {
    if (DEMO_MODE) return;
    const cap = window.setTimeout(() => {
      debugLog("auth", "useAuthReady: 6s cap elapsed (fail-open)");
      setCapElapsed(true);
    }, 6000);
    return () => window.clearTimeout(cap);
  }, []);

  const isReady =
    DEMO_MODE ||
    !!user ||
    !!session?.user ||
    initialized ||
    capElapsed;

  useEffect(() => {
    debugLog("auth", `useAuthReady: isReady=${isReady}`, {
      hasUser: !!user, initialized, capElapsed,
    });
  }, [isReady, user, initialized, capElapsed]);

  return { user, isReady };
}
