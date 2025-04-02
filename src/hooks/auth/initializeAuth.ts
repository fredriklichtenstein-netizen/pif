
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
    
    // Set a timeout to detect if the request is taking too long
    const timeoutId = setTimeout(() => {
      console.log('Auth initialization is taking longer than expected - possible network issues');
      auth.setError(new Error('Connection issue. Please check your internet and try again.'));
      auth.setNetworkError(true);
      auth.setLoading(false);
      auth.setInitialized(true);
    }, 15000); // Increased timeout to 15 seconds
    
    // First get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    // Clear the timeout as we got a response
    clearTimeout(timeoutId);
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      
      // Check if it's a network error
      if (sessionError.message?.includes('Load failed') || sessionError.message?.includes('fetch failed') || 
          sessionError.message?.includes('Failed to fetch') || sessionError.message?.includes('Network Error')) {
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
        // Check if profile is completed
        const profilePromise = supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();
          
        // Set a timeout for profile fetch
        const profileTimeoutId = setTimeout(() => {
          console.log('Profile fetch is taking longer than expected');
        }, 8000);
        
        const { data: profile, error: profileError } = await profilePromise;
        clearTimeout(profileTimeoutId);

        if (profileError) {
          console.error('Error fetching profile:', profileError);
          auth.setError(profileError);
        } else {
          console.log('Profile data:', profile);
          auth.setProfileCompleted(profile?.onboarding_completed ?? false);
        }
      } catch (error) {
        console.error('Error in profile check:', error);
        auth.setError(error instanceof Error ? error : new Error('Unknown error during profile check'));
      }
    } else {
      console.log('No active session found');
      auth.clearAuth();
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
    
    // Check if it's a network error
    if (error instanceof Error && 
        (error.message.includes('Load failed') || error.message.includes('fetch failed') ||
         error.message.includes('Failed to fetch') || error.message.includes('Network Error'))) {
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
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_OUT') {
        auth.clearAuth();
        return;
      }
      
      auth.setUser(session?.user ?? null);
      auth.setSession(session);
      
      if (session?.user) {
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('onboarding_completed')
            .eq('id', session.user.id)
            .maybeSingle();
          
          if (profileError) {
            console.error('Error fetching profile on auth change:', profileError);
            auth.setError(profileError);
          } else {
            auth.setProfileCompleted(profile?.onboarding_completed ?? false);
          }
        } catch (error) {
          console.error('Error in profile check on auth change:', error);
          auth.setError(error instanceof Error ? error : new Error('Unknown error during profile check'));
        }
      } else {
        auth.setProfileCompleted(null);
      }
    }
  );

  return subscription;
};
