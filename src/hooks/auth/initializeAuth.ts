
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "./authStore";
import { DEMO_MODE } from "@/config/demoMode";
import { DEMO_USER, DEMO_SESSION } from "@/data/mockUser";
import {
  clearRecoveryGuard,
  isAuthInvalidError,
  isNetworkError,
  recoverFromCorruptedSession,
} from "./sessionRecovery";

export { clearRecoveryGuard } from "./sessionRecovery";

const applyProfileCompletion = async (
  profile: { onboarding_completed?: boolean | null } | null | undefined,
  context: string,
  setCompleted: (completed: boolean | null) => void,
) => {
  if (!profile) {
    setCompleted(false);
    return true;
  }

  if (typeof profile.onboarding_completed === "boolean") {
    setCompleted(profile.onboarding_completed);
    return true;
  }

  if (profile.onboarding_completed === null) {
    setCompleted(false);
    return true;
  }

  await recoverFromCorruptedSession(`${context}: onboarding_completed missing`);
  return false;
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
        // Generous timeout — slow networks should not surface as auth errors.
        const profilePromise = Promise.race([
          supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout fetching profile')), 15000)
          )
        ]);

        const { data: profile, error: profileError } = await profilePromise as any;

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          if (isAuthInvalidError(profileError)) {
            await recoverFromCorruptedSession(`profile fetch: ${profileError.message}`);
            return;
          }
          // Network/transient/unknown errors: keep the session, log only.
          // Don't set auth.error — PrivateRoute would surface it as a destructive toast
          // even though the user is fully signed in.
          auth.setProfileCompleted(null);
        } else {
          const ok = await applyProfileCompletion(profile, "profile fetch", auth.setProfileCompleted);
          if (!ok) return;
        }
      } catch (error) {
        console.error('Error in profile check:', error);
        if (isAuthInvalidError(error)) {
          await recoverFromCorruptedSession(
            `profile fetch exception: ${error instanceof Error ? error.message : String(error)}`
          );
          return;
        }
        // Timeout / network / transient: don't sign the user out and don't
        // surface a destructive auth-error toast. Profile data will reload
        // when the user navigates or via background refresh.
        auth.setProfileCompleted(null);
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
      const previousUserId = currentAuth.user?.id ?? null;
      const nextUserId = session?.user?.id ?? null;

      // Account switching: a different user signed in than the one we had.
      // Wipe user-scoped caches before applying the new session so the UI
      // never shows the previous user's profile/avatar/items.
      if (
        nextUserId &&
        previousUserId &&
        nextUserId !== previousUserId
      ) {
        try {
          const { clearAllUserCaches } = await import("@/hooks/cache/clearUserCaches");
          clearAllUserCaches();
        } catch (err) {
          console.warn("Cache clear on account switch failed", err);
        }
      }

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
        try {
          const { clearAllUserCaches } = await import("@/hooks/cache/clearUserCaches");
          clearAllUserCaches();
        } catch (err) {
          console.warn("Cache clear on sign-out failed", err);
        }
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

          const ok = await applyProfileCompletion(profile, "auth change profile fetch", currentAuth.setProfileCompleted);
          if (!ok) return;
          // Successful sign-in + profile load — reset recovery loop guard.
          clearRecoveryGuard();
        } catch (error) {
          console.error('Error in profile check on auth change:', error);
          if (!isNetworkError(error)) {
            await recoverFromCorruptedSession(
              `auth change profile exception: ${error instanceof Error ? error.message : String(error)}`
            );
            return;
          }
          currentAuth.setError(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  );

  return subscription;
};
