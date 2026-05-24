
import { useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeConnection } from "./useRealtimeConnection";
import { useAuthStore } from "@/hooks/auth/authStore";

interface RealtimeUpdatesOptions {
  maxAttempts?: number;
  debounceMs?: number;
}

/**
 * Hook to handle subscribing to real-time updates for an item
 */
export const useRealtimeUpdates = (
  itemId: string, 
  refreshItemData: () => void,
  options: RealtimeUpdatesOptions = {}
) => {
  const { 
    isSubscribed, 
    error, 
    connectionAttempts,
    setIsSubscribed, 
    setError, 
    cleanupChannels,
    handleReconnect,
    channelsRef,
    setupAttemptedRef,
    handleCleanup
  } = useRealtimeConnection(itemId);
  const authInitialized = useAuthStore((s) => s.initialized);

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refreshItemDataRef = useRef(refreshItemData);
  const isSubscribedRef = useRef(isSubscribed);
  const numericIdRef = useRef<number | null>(null);
  const attemptCountRef = useRef(0);
  const maxAttempts = options.maxAttempts || 3;
  const debounceMs = options.debounceMs || 500;

  useEffect(() => {
    refreshItemDataRef.current = refreshItemData;
  }, [refreshItemData]);

  useEffect(() => {
    isSubscribedRef.current = isSubscribed;
  }, [isSubscribed]);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      refreshItemDataRef.current();
      refreshTimeoutRef.current = null;
    }, debounceMs);
  }, [debounceMs]);

  // Set up real-time subscription for item interactions
  const setupRealtimeSubscription = useCallback(() => {
    if (!authInitialized) return;
    if (!itemId || isSubscribedRef.current) return;
    
    // Prevent excessive retry attempts
    if (attemptCountRef.current >= maxAttempts) {
      setError(new Error(`Failed to subscribe after ${maxAttempts} attempts`));
      return;
    }
    
    attemptCountRef.current++;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericId = parseInt(itemId);
      if (isNaN(numericId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      numericIdRef.current = numericId;
      
      // Create a unique channel name with timestamp to avoid collisions
      const channelName = `item-combined-${numericId}-${Date.now()}`;
      // Consolidated channel for all table changes
      const combinedChannel = supabase
        .channel(channelName)
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'likes',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          debouncedRefresh();
        })
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'interests',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          debouncedRefresh();
        })
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          debouncedRefresh();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            channelsRef.current.push(combinedChannel);
            setIsSubscribed(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            console.error(`Channel error for item ${numericId}`);
            // Will be handled by the error recovery mechanism
          }
        });
        
      setupAttemptedRef.current = true;
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      
      // Retry subscription after delay if not max attempts
      if (attemptCountRef.current < maxAttempts) {
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          retryTimeoutRef.current = null;
          if (!isSubscribedRef.current) {
            setupRealtimeSubscription();
          }
        }, 2000 * attemptCountRef.current); // Exponential backoff
      }
    }
  }, [authInitialized, itemId, debouncedRefresh, maxAttempts, setError, setIsSubscribed, channelsRef]);

  // Setup subscription on mount
  useEffect(() => {
    if (authInitialized && itemId && !isSubscribed && !setupAttemptedRef.current) {
      setupRealtimeSubscription();
    }
    
    return () => {
      cleanupChannels();
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current !== null) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [authInitialized, itemId, setupRealtimeSubscription, cleanupChannels]);

  // Reset and retry on itemId change
  useEffect(() => {
    return () => {
      attemptCountRef.current = 0;
      setupAttemptedRef.current = false;
    };
  }, [itemId]);
  
  // Make sure to clean up properly on unmount
  useEffect(() => {
    return () => {
      handleCleanup();
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [handleCleanup]);

  return {
    isSubscribed,
    error,
    numericId: numericIdRef.current,
    cleanup: handleCleanup,
    retry: useCallback(() => {
      cleanupChannels();
      attemptCountRef.current = 0;
      setupAttemptedRef.current = false;
      setupRealtimeSubscription();
    }, [cleanupChannels, setupRealtimeSubscription])
  };
};
