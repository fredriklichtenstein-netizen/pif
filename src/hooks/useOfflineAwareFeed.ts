
import { useState, useEffect, useCallback } from "react";
import { MOCK_POSTS } from "@/data/mockPosts";

/**
 * Hook that monitors online/offline status and provides fallback mock data
 */
export function useOfflineAwareFeed() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasConnectionError, setHasConnectionError] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setHasConnectionError(false);
      setConnectionAttempts(0);
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const markConnectionError = useCallback(() => {
    setHasConnectionError(true);
    setConnectionAttempts(prev => prev + 1);
  }, []);

  const clearConnectionError = useCallback(() => {
    setHasConnectionError(false);
    setConnectionAttempts(0);
  }, []);

  // Show offline/mock mode if truly offline, or if we've had multiple failed connection attempts
  const shouldShowOfflineMode = !isOnline || (hasConnectionError && connectionAttempts >= 2);

  return {
    isOnline,
    hasConnectionError,
    connectionAttempts,
    shouldShowOfflineMode,
    mockPosts: MOCK_POSTS,
    markConnectionError,
    clearConnectionError
  };
}
