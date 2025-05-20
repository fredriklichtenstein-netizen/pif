
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { FeedItem } from "@/context/feed/types";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";

interface UseConsolidatedRealtimeFeedProps {
  queueRealtimeUpdate: (item: FeedItem) => void;
  queueRealtimeDelete: (itemId: string | number) => void;
}

export function useConsolidatedRealtimeFeed({
  queueRealtimeUpdate,
  queueRealtimeDelete
}: UseConsolidatedRealtimeFeedProps) {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const itemCacheRef = useRef<Map<number, FeedItem>>(new Map());
  
  // Function to fetch a single item for updates
  const fetchItemDetails = useCallback(async (itemId: number) => {
    try {
      const { data: item, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .eq('id', itemId)
        .single();
      
      if (error) throw error;
      
      if (item) {
        const user = extractUserFromProfile(item.profiles, item.user_id);
        
        const transformedItem: FeedItem = {
          id: item.id,
          title: item.title,
          description: item.description,
          images: item.images,
          location: item.location,
          coordinates: item.coordinates, // Accept coordinates as-is
          category: item.category,
          condition: item.condition,
          measurements: item.measurements,
          user_id: item.user_id,
          status: item.status,
          archived_at: item.archived_at,
          archived_reason: item.archived_reason,
          user_name: user.name,
          user_avatar: user.avatar || '',
          __transitionState: 'normal'
        };
        
        // Cache the item for future reference
        itemCacheRef.current.set(item.id, transformedItem);
        
        return transformedItem;
      }
    } catch (err) {
      console.error("Error fetching item details:", err);
    }
    return null;
  }, []);
  
  // Set up a consolidated realtime subscription for all items
  const setupRealtimeSubscription = useCallback(() => {
    if (channelRef.current) {
      // Cleanup existing subscription
      supabase.removeChannel(channelRef.current);
    }
    
    console.log("Setting up consolidated realtime feed subscription");
    
    // Create a unique channel name
    const channelId = `feed-consolidated-${Date.now()}`;
    
    try {
      // Create a single channel for the items table
      const channel = supabase
        .channel(channelId)
        .on('postgres_changes', 
          { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'items'
          }, 
          async (payload) => {
            console.log('New item created:', payload.new.id);
            const item = await fetchItemDetails(payload.new.id);
            if (item) {
              queueRealtimeUpdate(item);
            }
          })
        .on('postgres_changes', 
          { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'items'
          }, 
          async (payload) => {
            console.log('Item updated:', payload.new.id);
            const item = await fetchItemDetails(payload.new.id);
            if (item) {
              queueRealtimeUpdate(item);
            }
          })
        .on('postgres_changes', 
          { 
            event: 'DELETE', 
            schema: 'public', 
            table: 'items'
          }, 
          (payload) => {
            console.log('Item deleted:', payload.old.id);
            queueRealtimeDelete(payload.old.id);
          })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Realtime feed subscription active');
            setIsSubscribed(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Realtime feed subscription error');
            setIsSubscribed(false);
            setError(new Error('Failed to subscribe to realtime updates'));
          }
        });
      
      channelRef.current = channel;
    } catch (err) {
      console.error("Error setting up realtime subscription:", err);
      setError(err instanceof Error ? err : new Error('Unknown error in realtime subscription'));
    }
    
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [fetchItemDetails, queueRealtimeDelete, queueRealtimeUpdate]);
  
  // Set up the subscription on component mount
  useEffect(() => {
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [setupRealtimeSubscription]);
  
  return {
    isSubscribed,
    error,
    setupRealtimeSubscription
  };
}
