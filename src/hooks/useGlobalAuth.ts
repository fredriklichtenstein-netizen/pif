
import { useEffect } from 'react';
import { useAuthStore } from './auth/authStore';
import { initializeAuth as initAuth } from './auth/initializeAuth';
import { checkNetworkConnection as checkNetwork } from './auth/networkUtils';

const MAX_LOADING_TIMEOUT = 5000;

// Wrapper hook that adds a safety timeout to prevent stuck loading states
export const useGlobalAuth = () => {
  const state = useAuthStore();

  useEffect(() => {
    if (!state.isLoading) return;

    const timeoutId = setTimeout(() => {
      const current = useAuthStore.getState();
      if (current.isLoading) {
        console.warn('useGlobalAuth: Loading state timed out after 5s, forcing to false.');
        current.setLoading(false);
      }
    }, MAX_LOADING_TIMEOUT);

    return () => clearTimeout(timeoutId);
  }, [state.isLoading]);

  return state;
};

// Re-export initialization function
export const initializeAuth = initAuth;

// Re-export network check utility
export const checkNetworkConnection = checkNetwork;
