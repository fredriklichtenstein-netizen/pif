
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
  const isRefreshingRef = useRef(false);

  // Debounced refresh function with much longer default delay
  const debouncedRefresh = useCallback((delay = 5000) => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress, postponing');
      delay += 2000; // Add extra delay if already refreshing
    }
    
    console.log(`Scheduling debounced refresh with ${delay}ms delay`);
    refreshTimeoutRef.current = setTimeout(() => {
      console.log('Executing debounced feed refresh');
      isRefreshingRef.current = true;
      
      loadPostsBasedOnViewMode(viewMode)
        .finally(() => {
          isRefreshingRef.current = false;
          refreshTimeoutRef.current = null;
        });
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
    
    // Update the key to force a component remount only when absolutely necessary
    setFeedKey(Date.now());
    
    // Force refresh after a significant delay
    forceRefreshTimeoutRef.current = setTimeout(() => {
      isRefreshingRef.current = true;
      loadPostsBasedOnViewMode(viewMode)
        .finally(() => {
          isRefreshingRef.current = false;
          forceRefreshTimeoutRef.current = null;
        });
    }, 3000);
  }, [viewMode, loadPostsBasedOnViewMode]);

  // Cleanup function
  const cleanupRefreshTimers = useCallback(() => {
    console.log("Cleaning up all refresh timers");
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
      refreshTimeoutRef.current = null;
    }
    if (forceRefreshTimeoutRef.current !== null) {
      clearTimeout(forceRefreshTimeoutRef.current);
      forceRefreshTimeoutRef.current = null;
    }
    isRefreshingRef.current = false;
  }, []);

  return {
    debouncedRefresh,
    forceCompleteRefresh,
    cleanupRefreshTimers,
    isRefreshing: isRefreshingRef.current,
    refreshTimeoutRef,
    forceRefreshTimeoutRef
  };
};
