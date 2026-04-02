
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "./authStore";
import { DEMO_MODE } from "@/config/demoMode";
import { DEMO_USER, DEMO_SESSION } from "@/data/mockUser";

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
    
    // Set a more reasonable timeout
    const timeoutId = setTimeout(() => {
      console.log('Auth initialization timed out - possible network issues');
      auth.setError(new Error('Connection issue. Please check your internet and try again.'));
      auth.setNetworkError(true);
      auth.setLoading(false);
      auth.setInitialized(true);
    }, 5000);
    
    // Use Promise.race to enforce timeout
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout getting session')), 4000)
      )
    ]);
    
    // Clear the timeout as we got a response
    clearTimeout(timeoutId);
    
    // Type assertion for the successful case
    const { data: { session }, error: sessionError } = sessionResult as Awaited<ReturnType<typeof supabase.auth.getSession>>;
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      
      // Check if it's a network error
      if (sessionError.message?.includes('Load failed') || 
          sessionError.message?.includes('fetch failed') || 
          sessionError.message?.includes('Failed to fetch') || 
          sessionError.message?.includes('Network Error') ||
          sessionError.message?.includes('Timeout')) {
        auth.setNetworkError(true);
      }
      
      auth.setError(sessionError);
      auth.setLoading(false);
      auth.setInitialized(true);
      return;
    }
    
    if (session?.user) {
      console.log('User session found:', session.user.id);
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
      console.log('No active session found');
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
    console.log('Auth initialization complete');
  }

  // Set up auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth state changed:', event);

      const currentAuth = useAuthStore.getState();

      // Handle token refresh and tab-focus sign-in silently
      if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION' ||
          (event === 'SIGNED_IN' && currentAuth.initialized)) {
        if (session) {
          currentAuth.setSession(session);
          currentAuth.setUser(session.user);
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
