
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "./authStore";

export const initializeAuth = async () => {
  const auth = useAuthStore.getState();
  if (auth.initialized) return;

  try {
    console.log('Initializing auth state...');
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
    }, 10000); // Reduced from 15000ms
    
    // Use Promise.race to enforce timeout
    const sessionResult = await Promise.race([
      supabase.auth.getSession(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Timeout getting session')), 8000)
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
      
      if (event === 'SIGNED_OUT') {
        auth.clearAuth();
        return;
      }
      
      auth.setUser(session?.user ?? null);
      auth.setSession(session);
      
      if (session?.user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();
          
          auth.setProfileCompleted(profile?.onboarding_completed ?? false);
        } catch (error) {
          console.error('Error in profile check on auth change:', error);
          // Don't fail the auth process for profile issues
          auth.setProfileCompleted(false);
        }
      } else {
        auth.setProfileCompleted(null);
      }
    }
  );

  return subscription;
};
