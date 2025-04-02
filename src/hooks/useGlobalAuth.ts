
import { useAuthStore } from './auth/authStore';
import { initializeAuth as initAuth } from './auth/initializeAuth';
import { checkNetworkConnection as checkNetwork } from './auth/networkUtils';

// Export store hook as the main hook
export const useGlobalAuth = useAuthStore;

// Re-export initialization function
export const initializeAuth = initAuth;

// Re-export network check utility
export const checkNetworkConnection = checkNetwork;
