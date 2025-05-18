
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedContext } from "@/context/FeedContext";
import { useToast } from "@/hooks/use-toast";

export const useRealtimeFeed = () => {
  const { items, syncFromServer, setItems } = useFeedContext();
  const { toast } = useToast();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastUpdateTimeRef = useRef(Date.now());

  // Cleanup function for Supabase channel
  const cleanupRealtimeSubscription = useCallback(() => {
    if (realtimeChannelRef.current) {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback(() => {
    // Clean up any existing subscription
    cleanupRealtimeSubscription();

    console.log('Setting up realtime feed subscription');
    
    // Create a unique channel name
    const channelId = `feed-realtime-${Date.now()}`;
    
    // Create a channel for items table changes
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'items'
        }, 
        (payload) => {
          console.log('Realtime feed update received:', payload);
          
          const now = Date.now();
          // If we recently updated, delay this update to avoid too many refreshes
          if (now - lastUpdateTimeRef.current < 2000) {
            setTimeout(() => {
              handleRealtimeUpdate(payload);
            }, 2000);
          } else {
            handleRealtimeUpdate(payload);
          }
          lastUpdateTimeRef.current = now;
        })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime feed subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime feed subscription error');
          toast({
            title: "Realtime updates unavailable",
            description: "Some updates may be delayed",
            variant: "destructive",
          });
        }
      });

    // Store the channel reference for cleanup
    realtimeChannelRef.current = channel;
    
    return cleanupRealtimeSubscription;
  }, [cleanupRealtimeSubscription, toast]);

  // Handle realtime updates
  const handleRealtimeUpdate = useCallback((payload: any) => {
    console.log('Processing realtime update:', payload.eventType);
    
    if (!payload || !payload.new) return;
    
    // Process the update - we'll do a smarter sync later
    // For now we'll just fetch the updated item
    const updatedItem = payload.new;
    
    // Instead of a full refetch, we'll update just this item in our local state
    const updatedItems = items.map(item => {
      if (item.id.toString() === updatedItem.id.toString()) {
        // If we have UI state for this item, preserve it
        return {
          ...updatedItem,
          __transitionState: item.__transitionState || 'normal',
          __modified: item.__modified,
          user_name: item.user_name, // Preserve user data that may not be in the payload
          user_avatar: item.user_avatar
        };
      }
      return item;
    });
    
    // If the item was not found in our existing items, add it (if it's an INSERT)
    if (payload.eventType === 'INSERT' && 
        !items.some(item => item.id.toString() === updatedItem.id.toString())) {
      updatedItems.push({
        ...updatedItem,
        __transitionState: 'normal'
      });
    }
    
    // Update our feed context with the change
    setItems(updatedItems);
    
    // Show a notification for some events
    if (payload.eventType === 'UPDATE' && updatedItem.archived_at && 
        !items.find(i => i.id.toString() === updatedItem.id.toString())?.archived_at) {
      toast({
        title: "Item archived",
        description: `"${updatedItem.title}" has been archived`,
        variant: "default",
      });
    }
  }, [items, setItems, toast]);

  // Effect to set up the realtime subscription
  useEffect(() => {
    // Only set up if we have items
    if (items.length > 0) {
      return setupRealtimeSubscription();
    }
    return cleanupRealtimeSubscription;
  }, [items.length, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Return the cleanup function for component unmount
  return {
    cleanupRealtimeSubscription
  };
};
