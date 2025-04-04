
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useItemRealtimeUpdates = (
  itemId: string, 
  refreshItemData: () => void
) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Set up real-time subscription for item interactions
  useEffect(() => {
    if (!itemId || isSubscribed) return;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Setting up real-time subscription for interactions on item ${numericItemId}`);

      // Subscribe to likes changes
      const likesChannel = supabase
        .channel('item-likes-changes')
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'likes',
          filter: `item_id=eq.${numericItemId}`,
        }, () => {
          console.log('Real-time likes change detected');
          refreshItemData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to likes changes');
          }
        });

      // Subscribe to interests changes
      const interestsChannel = supabase
        .channel('item-interests-changes')
        .on('postgres_changes', {
          event: '*', // All events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'interests',
          filter: `item_id=eq.${numericItemId}`,
        }, () => {
          console.log('Real-time interests change detected');
          refreshItemData();
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Subscribed to interests changes');
            setIsSubscribed(true);
          }
        });

      // Clean up subscriptions when component unmounts
      return () => {
        console.log('Cleaning up real-time subscriptions');
        supabase.removeChannel(likesChannel);
        supabase.removeChannel(interestsChannel);
        setIsSubscribed(false);
      };
    } catch (error) {
      console.error('Error setting up real-time subscriptions:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }, [itemId, isSubscribed, refreshItemData]);

  return {
    isSubscribed,
    error
  };
};
