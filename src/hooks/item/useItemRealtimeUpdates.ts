
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
  }, [itemId]);

  // Set up real-time subscription for item interactions
  useEffect(() => {
    // Prevent multiple setup attempts for the same itemId
    if (!itemId || isSubscribed || setupAttemptedRef.current) return;
    
    setupAttemptedRef.current = true;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericId = parseInt(itemId);
      if (isNaN(numericId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      numericIdRef.current = numericId;
      console.log(`Setting up real-time subscription for interactions on item ${numericId}`);

      // Subscribe to likes changes
      const likesChannel = supabase
        .channel(`item-likes-changes-${numericId}`)
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'likes',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          console.log('Real-time likes change detected');
          debouncedRefresh();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to likes changes');
            channelsRef.current.push(likesChannel);
          }
        });

      // Subscribe to interests changes
      const interestsChannel = supabase
        .channel(`item-interests-changes-${numericId}`)
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'interests',
          filter: `item_id=eq.${numericId}`,
        }, () => {
          console.log('Real-time interests change detected');
          debouncedRefresh();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to interests changes');
            channelsRef.current.push(interestsChannel);
            setIsSubscribed(true);
          }
        });

      // Clean up subscriptions when component unmounts
      return () => {
        cleanupChannels();
        setupAttemptedRef.current = false;
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [itemId, debouncedRefresh, isSubscribed, cleanupChannels]);

  // Extra cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
      cleanupChannels();
    };
  }, [cleanupChannels]);

  return {
    isSubscribed,
    error,
    numericId: numericIdRef.current
  };
};
