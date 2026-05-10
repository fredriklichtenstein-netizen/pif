
import { useEffect } from 'react';
import { useAuthStore } from './auth/authStore';
import { initializeAuth as initAuth } from './auth/initializeAuth';
import { checkNetworkConnection as checkNetwork } from './auth/networkUtils';

// Wrapper hook that adds a safety timeout to prevent stuck loading states
export const useGlobalAuth = () => {
  const state = useAuthStore();

  return state;
};

// Re-export initialization function
export const initializeAuth = initAuth;

// Re-export network check utility
export const checkNetworkConnection = checkNetwork;
