
import { useRef, useCallback } from 'react';

interface UseFeedRefreshProps {
  loadPostsBasedOnViewMode: (mode: string) => Promise<void>;
  viewMode: string;
}

export const useFeedRefresh = ({
  loadPostsBasedOnViewMode,
  viewMode
}: UseFeedRefreshProps) => {
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback((delay = 300) => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('Executing debounced feed refresh');
      loadPostsBasedOnViewMode(viewMode);
      refreshTimeoutRef.current = null;
    }, delay);
  }, [viewMode, loadPostsBasedOnViewMode]);

  // Function to force a complete refresh of the feed
  const forceCompleteRefresh = useCallback((setFeedKey: (key: number) => void) => {
    // Clear any ongoing timers
    if (forceRefreshTimeoutRef.current) {
      clearTimeout(forceRefreshTimeoutRef.current);
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Log the refresh
    console.log("Forcing complete feed refresh");
    
    // Update the key to force a component remount
    setFeedKey(Date.now());
    
    // Force refresh after a delay
    forceRefreshTimeoutRef.current = setTimeout(() => {
      loadPostsBasedOnViewMode(viewMode);
      forceRefreshTimeoutRef.current = null;
    }, 300);
  }, [viewMode, loadPostsBasedOnViewMode]);

  // Cleanup function
  const cleanupRefreshTimers = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    if (forceRefreshTimeoutRef.current !== null) {
      clearTimeout(forceRefreshTimeoutRef.current);
    }
  }, []);

  return {
    debouncedRefresh,
    forceCompleteRefresh,
    cleanupRefreshTimers,
    refreshTimeoutRef,
    forceRefreshTimeoutRef
  };
};
