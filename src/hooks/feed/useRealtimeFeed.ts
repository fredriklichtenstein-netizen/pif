
import { useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useFeedContext } from "@/context/feed"; 
import { useToast } from "@/hooks/use-toast";
import { FeedItem } from "@/context/feed/types";

export const useRealtimeFeed = () => {
  const { items, syncFromServer, setItems } = useFeedContext();
  const { toast } = useToast();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const pendingUpdatesRef = useRef<any[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Process batched updates after a delay
  const processPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length === 0) return;
    
    console.log(`Processing ${pendingUpdatesRef.current.length} batched realtime updates`);
    
    // Group updates by operation type
    const inserts = pendingUpdatesRef.current.filter(p => p.eventType === 'INSERT').map(p => p.new);
    const updates = pendingUpdatesRef.current.filter(p => p.eventType === 'UPDATE').map(p => p.new);
    const deletes = pendingUpdatesRef.current.filter(p => p.eventType === 'DELETE').map(p => p.old);
    
    // Create a new array from the current items - crucial for avoiding type issues
    const newItemsArray = [...items];
    
    // Create a map for faster lookups
    const itemsMap = new Map<string, FeedItem>();
    newItemsArray.forEach(item => itemsMap.set(item.id.toString(), item));
    
    // Apply deletions
    deletes.forEach(item => {
      itemsMap.delete(item.id.toString());
    });
    
    // Apply updates
    updates.forEach((update: any) => {
      const existingItem = itemsMap.get(update.id.toString());
      if (existingItem) {
        // Preserve UI state
        itemsMap.set(update.id.toString(), {
          ...update,
          __transitionState: existingItem.__transitionState || 'normal',
          __modified: existingItem.__modified,
          user_name: existingItem.user_name, // Preserve user data
          user_avatar: existingItem.user_avatar
        } as FeedItem);
      }
    });
    
    // Add insertions
    inserts.forEach((insert: any) => {
      // Only add if it doesn't already exist
      if (!itemsMap.has(insert.id.toString())) {
        itemsMap.set(insert.id.toString(), {
          ...insert,
          __transitionState: 'normal'
        } as FeedItem);
      }
    });
    
    // Convert map back to array
    const updatedItemsArray: FeedItem[] = Array.from(itemsMap.values());
    
    // Call setItems with the direct array value, not a function
    setItems(updatedItemsArray);
    
    // Clear pending updates
    pendingUpdatesRef.current = [];
    
    // Show notification only if significant changes occurred
    if (inserts.length > 0) {
      toast({
        title: "New content available",
        description: `${inserts.length} new item${inserts.length > 1 ? 's' : ''} added`,
        variant: "default",
      });
    }
  }, [items, setItems, toast]);

  // Queue an update instead of processing immediately
  const queueRealtimeUpdate = useCallback((payload: any) => {
    // Add to pending updates
    pendingUpdatesRef.current.push(payload);
    
    // Clear any existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // Schedule processing after a delay (batch updates over 5 seconds)
    updateTimerRef.current = setTimeout(() => {
      processPendingUpdates();
      updateTimerRef.current = null;
    }, 5000);
  }, [processPendingUpdates]);

  // Cleanup function for Supabase channel
  const cleanupRealtimeSubscription = useCallback(() => {
    if (realtimeChannelRef.current) {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
    
    // Clear any pending update timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
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
          console.log('Realtime feed update received:', payload.eventType);
          
          const now = Date.now();
          // Much longer minimum time between updates (from 2s to 10s)
          if (now - lastUpdateTimeRef.current < 10000) {
            console.log('Update received too soon after last update, queueing');
            queueRealtimeUpdate(payload);
          } else {
            console.log('Processing update immediately');
            queueRealtimeUpdate(payload);
            lastUpdateTimeRef.current = now;
          }
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
  }, [cleanupRealtimeSubscription, toast, queueRealtimeUpdate]);

  // Effect to set up the realtime subscription
  useEffect(() => {
    // Only set up if we have items
    if (items.length > 0) {
      return setupRealtimeSubscription();
    }
    return cleanupRealtimeSubscription;
  }, [items.length, setupRealtimeSubscription, cleanupRealtimeSubscription]);

  // Process any pending updates when component unmounts
  useEffect(() => {
    return () => {
      if (pendingUpdatesRef.current.length > 0) {
        processPendingUpdates();
      }
      cleanupRealtimeSubscription();
    };
  }, [processPendingUpdates, cleanupRealtimeSubscription]);

  // Return the cleanup function for component unmount
  return {
    cleanupRealtimeSubscription
  };
};
