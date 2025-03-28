
import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  profileCompleted: boolean | null;
  isLoading: boolean;
  initialized: boolean;
  error: Error | null;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfileCompleted: (completed: boolean | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: Error | null) => void;
}

export const useGlobalAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  profileCompleted: null,
  isLoading: true,
  initialized: false,
  error: null,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfileCompleted: (completed) => set({ profileCompleted: completed }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ initialized }),
  setError: (error) => set({ error }),
}));

export const initializeAuth = async () => {
  const auth = useGlobalAuth.getState();
  if (auth.initialized) return;

  try {
    console.log('Initializing auth state...');
    auth.setLoading(true);
    auth.setError(null);
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
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
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .maybeSingle();

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
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
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
