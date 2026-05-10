
import { useAuthStore } from './auth/authStore';
import { initializeAuth as initAuth } from './auth/initializeAuth';
import { checkNetworkConnection as checkNetwork } from './auth/networkUtils';

// Wrapper hook for the global auth state. Do not force-clear loading here:
// initializeAuth must be allowed to await supabase.auth.getSession() fully.
export const useGlobalAuth = () => {
  const state = useAuthStore();

  return state;
};

// Re-export initialization function
export const initializeAuth = initAuth;

// Re-export network check utility
export const checkNetworkConnection = checkNetwork;
