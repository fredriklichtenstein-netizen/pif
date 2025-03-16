
import { create } from 'zustand';
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  profileCompleted: boolean | null;
  isLoading: boolean;
  initialized: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfileCompleted: (completed: boolean | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
}

export const useGlobalAuth = create<AuthState>((set) => ({
  user: null,
  session: null,
  profileCompleted: null,
  isLoading: true,
  initialized: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfileCompleted: (completed) => set({ profileCompleted: completed }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ initialized }),
}));

export const initializeAuth = async () => {
  const auth = useGlobalAuth.getState();
  if (auth.initialized) return;

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      auth.setUser(session.user);
      auth.setSession(session);
      
      // Check if profile is completed
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();

      if (!error) {
        auth.setProfileCompleted(profile?.onboarding_completed ?? false);
      }
    }
  } catch (error) {
    console.error('Error initializing auth:', error);
  } finally {
    auth.setLoading(false);
    auth.setInitialized(true);
  }

  // Set up auth listener
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (_event, session) => {
      auth.setUser(session?.user ?? null);
      auth.setSession(session);
      
      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('onboarding_completed')
          .eq('id', session.user.id)
          .single();
        
        auth.setProfileCompleted(profile?.onboarding_completed ?? false);
      } else {
        auth.setProfileCompleted(null);
      }
      
      auth.setLoading(false);
    }
  );

  return subscription;
};
