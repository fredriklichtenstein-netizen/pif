
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useItemRealtimeUpdates = (
  itemId: string, 
  refreshItemData: () => void
) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelsRef = useRef<any[]>([]);
  const setupAttemptedRef = useRef(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const numericIdRef = useRef<number | null>(null);
  const attemptCountRef = useRef(0);
  const maxAttempts = 3;

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      console.log(`Refreshing data for item ${itemId} due to real-time update`);
      refreshItemData();
      refreshTimeoutRef.current = null;
    }, 500);
  }, [refreshItemData, itemId]);

  // Clean up function to remove all channels
  const cleanupChannels = useCallback(() => {
    if (channelsRef.current.length === 0) {
      console.log(`No channels to clean up for item ${itemId}`);
      return;
    }
    
    console.log(`Cleaning up ${channelsRef.current.length} channels for item ${itemId}`);
    
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.error("Error removing channel:", e);
      }
    });
    
    channelsRef.current = [];
    setIsSubscribed(false);
    setupAttemptedRef.current = false;
  }, [itemId]);

  // Set up real-time subscription for item interactions
  const setupRealtimeSubscription = useCallback(() => {
    if (!itemId || isSubscribed) return;
    
    // Prevent excessive retry attempts
    if (attemptCountRef.current >= maxAttempts) {
      console.log(`Max subscription attempts (${maxAttempts}) reached for item ${itemId}`);
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
      
      // Consolidated channel for all table changes
      const combinedChannel = supabase
        .channel(`item-combined-${numericId}-${Date.now()}`) // Unique channel name
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'likes',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          console.log('Real-time likes change detected for item', numericId);
          debouncedRefresh();
        })
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'interests',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          console.log('Real-time interests change detected for item', numericId);
          debouncedRefresh();
        })
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          console.log('Real-time comments change detected for item', numericId);
          debouncedRefresh();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to all changes for item ${numericId}`);
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
  }, [itemId, debouncedRefresh, isSubscribed]);

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

  return {
    isSubscribed,
    error,
    numericId: numericIdRef.current,
    retry: useCallback(() => {
      cleanupChannels();
      attemptCountRef.current = 0;
      setupAttemptedRef.current = false;
      setupRealtimeSubscription();
    }, [cleanupChannels, setupRealtimeSubscription])
  };
};
