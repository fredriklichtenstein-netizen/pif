
import { create } from 'zustand';
import type { User, Session } from "@supabase/supabase-js";

interface AuthState {
  user: User | null;
  session: Session | null;
  profileCompleted: boolean | null;
  isLoading: boolean;
  initialized: boolean;
  error: Error | null;
  networkError: boolean;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfileCompleted: (completed: boolean | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  setError: (error: Error | null) => void;
  setNetworkError: (hasError: boolean) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  session: null,
  profileCompleted: null,
  // Start in loading state on first render so the UI does not flash
  // an "unauthenticated" view before initializeAuth() restores the session.
  isLoading: true,
  initialized: false,
  error: null,
  networkError: false,
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setProfileCompleted: (completed) => set({ profileCompleted: completed }),
  setLoading: (loading) => set({ isLoading: loading }),
  setInitialized: (initialized) => set({ initialized }),
  setError: (error) => set({ error }),
  setNetworkError: (hasError) => set({ networkError: hasError }),
  clearAuth: () => set({ 
    user: null, 
    session: null, 
    profileCompleted: null, 
    error: null,
    networkError: false
  }),
}));
