
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
  const refreshTimeoutRef = useRef<number | null>(null);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback(() => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = window.setTimeout(() => {
      refreshItemData();
      refreshTimeoutRef.current = null;
    }, 300) as unknown as number;
  }, [refreshItemData]);

  // Set up real-time subscription for item interactions
  useEffect(() => {
    // Prevent multiple setup attempts for the same itemId
    if (!itemId || isSubscribed || setupAttemptedRef.current) return;
    
    setupAttemptedRef.current = true;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Setting up real-time subscription for interactions on item ${numericItemId}`);

      // Subscribe to likes changes
      const likesChannel = supabase
        .channel(`item-likes-changes-${numericItemId}`)
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'likes',
          filter: `item_id=eq.${numericItemId}`,
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
        .channel(`item-interests-changes-${numericItemId}`)
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'interests',
          filter: `item_id=eq.${numericItemId}`,
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
        console.log('Cleaning up real-time subscriptions');
        if (refreshTimeoutRef.current !== null) {
          clearTimeout(refreshTimeoutRef.current);
        }
        channelsRef.current.forEach(channel => {
          supabase.removeChannel(channel);
        });
        channelsRef.current = [];
        setIsSubscribed(false);
        setupAttemptedRef.current = false;
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [itemId, debouncedRefresh]);

  return {
    isSubscribed,
    error
  };
};
