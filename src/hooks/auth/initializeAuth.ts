
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "./authStore";
import { DEMO_MODE } from "@/config/demoMode";
import { DEMO_USER, DEMO_SESSION } from "@/data/mockUser";

/**
 * Recover from a corrupted auth state (e.g. stale JWT after a deploy).
 * Clears Supabase auth tokens from localStorage, signs out, and redirects
 * to /auth so the user can start a clean session — instead of being stuck
 * on a blank page.
 */
const RECOVERY_GUARD_KEY = "auth.recoveryGuard";
const RECOVERY_WINDOW_MS = 60_000; // 1 minute
const RECOVERY_MAX_ATTEMPTS = 2;

interface RecoveryGuardState {
  count: number;
  firstAt: number;
}

const readGuard = (): RecoveryGuardState => {
  try {
    const raw = window.sessionStorage.getItem(RECOVERY_GUARD_KEY);
    if (!raw) return { count: 0, firstAt: 0 };
    const parsed = JSON.parse(raw) as RecoveryGuardState;
    if (!parsed || typeof parsed.firstAt !== "number") return { count: 0, firstAt: 0 };
    if (Date.now() - parsed.firstAt > RECOVERY_WINDOW_MS) {
      return { count: 0, firstAt: 0 };
    }
    return parsed;
  } catch {
    return { count: 0, firstAt: 0 };
  }
};

const writeGuard = (state: RecoveryGuardState) => {
  try {
    window.sessionStorage.setItem(RECOVERY_GUARD_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

export const clearRecoveryGuard = () => {
  try {
    window.sessionStorage.removeItem(RECOVERY_GUARD_KEY);
  } catch {
    // ignore
  }
};

const recoverFromCorruptedSession = async (reason: string) => {
  // Loop guard: if we've already tried recovery recently, stop bouncing the
  // user. Surface the broken state to the auth store instead so the existing
  // error UI ("can't sign in / network error") takes over.
  const guard = readGuard();
  if (guard.count >= RECOVERY_MAX_ATTEMPTS) {
    console.warn(
      "[auth] recovery loop guard tripped, skipping redirect:",
      reason,
      guard,
    );
    try {
      const auth = useAuthStore.getState();
      auth.clearAuth();
      auth.setError(new Error("Session recovery failed repeatedly"));
      auth.setLoading(false);
      auth.setInitialized(true);
    } catch {
      // noop
    }
    return;
  }
  writeGuard({
    count: guard.count + 1,
    firstAt: guard.firstAt || Date.now(),
  });

  console.warn("[auth] Detected corrupted session, recovering:", reason);
  try {
    await supabase.auth.signOut({ scope: "local" } as any);
  } catch (e) {
    // ignore — we'll wipe storage manually below
  }
  try {
    if (typeof window !== "undefined" && window.localStorage) {
      const keys: string[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i);
        if (k && (k.startsWith("sb-") || k.includes("supabase.auth"))) {
          keys.push(k);
        }
      }
      keys.forEach((k) => window.localStorage.removeItem(k));
    }
  } catch (e) {
    console.error("[auth] failed to clear local storage", e);
  }
  try {
    useAuthStore.getState().clearAuth();
    useAuthStore.getState().setLoading(false);
    useAuthStore.getState().setInitialized(true);
  } catch {
    // noop
  }
  if (
    typeof window !== "undefined" &&
    window.location.pathname !== "/auth" &&
    window.location.pathname !== "/" &&
    !window.location.pathname.startsWith("/reset-password") &&
    !window.location.pathname.startsWith("/email-confirmation")
  ) {
    window.location.replace("/auth?recovered=1");
  }
};


const isAuthInvalidError = (err: any): boolean => {
  if (!err) return false;
  const msg = String(err.message || err.error_description || "").toLowerCase();
  const code = String(err.code || "").toUpperCase();
  const status = Number(err.status || err.statusCode || 0);
  if (status === 401 || status === 403) return true;
  if (code === "PGRST301" || code === "PGRST302") return true;
  return (
    msg.includes("jwt expired") ||
    msg.includes("invalid jwt") ||
    msg.includes("jwt malformed") ||
    msg.includes("invalid refresh token") ||
    msg.includes("refresh token not found") ||
    msg.includes("user from sub claim") ||
    msg.includes("session not found") ||
    msg.includes("token has expired")
  );
};

const isNetworkError = (err: any): boolean => {
  const msg = String(err?.message || "").toLowerCase();
  return (
    msg.includes("load failed") ||
    msg.includes("fetch failed") ||
    msg.includes("failed to fetch") ||
    msg.includes("network error") ||
    msg.includes("timeout")
  );
};


export const initializeAuth = async () => {
  const auth = useAuthStore.getState();
  
  if (auth.initialized) return;

  // In demo mode, skip Supabase entirely and set demo user immediately
  if (DEMO_MODE) {
    
    auth.setUser(DEMO_USER);
    auth.setSession(DEMO_SESSION);
    auth.setProfileCompleted(true);
    auth.setLoading(false);
    auth.setInitialized(true);
    // No subscription needed in demo mode
    return undefined;
  }

  try {
    
    auth.setLoading(true);
    auth.setError(null);
    auth.setNetworkError(false);
    
    // Restore session directly from storage. Do NOT race against a short timeout —
    // getSession() reads from localStorage synchronously in practice, and racing it
    // can cause refreshed pages to appear signed-out before storage is read.
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      
      if (isNetworkError(sessionError)) {
        auth.setNetworkError(true);
        auth.setError(sessionError);
        auth.setLoading(false);
        auth.setInitialized(true);
        return;
      }
      
      if (isAuthInvalidError(sessionError)) {
        await recoverFromCorruptedSession(`getSession: ${sessionError.message}`);
        return;
      }
      
      auth.setError(sessionError);
      auth.setLoading(false);
      auth.setInitialized(true);
      return;
    }
    
    if (session?.user) {
      
      auth.setUser(session.user);
      auth.setSession(session);
      
      try {
        // Use a simpler query with timeout
        const profilePromise = Promise.race([
          supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout fetching profile')), 5000)
          )
        ]);
        
        const { data: profile, error: profileError } = await profilePromise as any;

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          if (isAuthInvalidError(profileError)) {
            await recoverFromCorruptedSession(`profile fetch: ${profileError.message}`);
            return;
          }
          // Network/transient errors: don't wipe the session, just continue.
          auth.setError(profileError);
        } else {
          auth.setProfileCompleted(profile?.onboarding_completed ?? false);
        }
      } catch (error) {
        console.error('Error in profile check:', error);
        // Don't fail the whole auth process for profile check errors
        auth.setProfileCompleted(false);
      }
    } else {
      
      auth.clearAuth();
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    
    // Check if it's a network error
    if (error instanceof Error && 
        (error.message.includes('Load failed') || 
         error.message.includes('fetch failed') ||
         error.message.includes('Failed to fetch') || 
         error.message.includes('Network Error') ||
         error.message.includes('Timeout'))) {
      auth.setNetworkError(true);
    }
    
    auth.setError(error instanceof Error ? error : new Error('Unknown error during auth initialization'));
  } finally {
    auth.setLoading(false);
    auth.setInitialized(true);
    
  }

  // Set up auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      

      const currentAuth = useAuthStore.getState();

      // Handle token refresh and tab-focus sign-in silently
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' ||
          (event === 'SIGNED_IN' && currentAuth.initialized)) {
        if (session) {
          currentAuth.setSession(session);
          currentAuth.setUser(session.user);
          // Healthy session — reset recovery loop guard.
          clearRecoveryGuard();
        }
        return; // Don't trigger any loading state or re-initialization
      }

      if (event === 'SIGNED_OUT') {
        currentAuth.clearAuth();
        return;
      }

      // Only reach here for genuine first-time SIGNED_IN
      currentAuth.setUser(session?.user ?? null);
      currentAuth.setSession(session);

      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();

          currentAuth.setProfileCompleted(profile?.onboarding_completed ?? false);
        } catch (error) {
          console.error('Error in profile check on auth change:', error);
          currentAuth.setProfileCompleted(false);
        }
      }
    }
  );

  return subscription;
};
