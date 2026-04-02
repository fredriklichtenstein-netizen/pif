
import { useState, useCallback, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useRealtimeConnection } from "./useRealtimeConnection";

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

  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const numericIdRef = useRef<number | null>(null);
  const attemptCountRef = useRef(0);
  const maxAttempts = options.maxAttempts || 3;
  const debounceMs = options.debounceMs || 500;

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      refreshItemData();
      refreshTimeoutRef.current = null;
    }, debounceMs);
  }, [refreshItemData, itemId, debounceMs]);

  // Set up real-time subscription for item interactions
  const setupRealtimeSubscription = useCallback(() => {
    if (!itemId || isSubscribed) return;
    
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
        setTimeout(() => {
          if (!isSubscribed) {
            setupRealtimeSubscription();
          }
        }, 2000 * attemptCountRef.current); // Exponential backoff
      }
    }
  }, [itemId, debouncedRefresh, isSubscribed, maxAttempts, setError, setIsSubscribed, channelsRef]);

  // Setup subscription on mount
  useEffect(() => {
    if (itemId && !isSubscribed && !setupAttemptedRef.current) {
      setupRealtimeSubscription();
    }
    
    return () => {
      cleanupChannels();
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [itemId, isSubscribed, setupRealtimeSubscription, cleanupChannels]);

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
