
import { useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { FeedItem } from "@/context/feed/types";

export function useRealtimeUpdateQueue(items: FeedItem[], setItems: (items: FeedItem[]) => void) {
  const { toast } = useToast();
  const pendingUpdatesRef = useRef<any[]>([]);
  const updateTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef(Date.now());
  const [hasNewUpdates, setHasNewUpdates] = useState(false);

  // Process batched updates after a delay
  const processPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length === 0) return;
    
    console.log(`Processing ${pendingUpdatesRef.current.length} batched realtime updates`);
    
    // Group updates by operation type
    const inserts = pendingUpdatesRef.current.filter(p => p.eventType === 'INSERT').map(p => p.new);
    const updates = pendingUpdatesRef.current.filter(p => p.eventType === 'UPDATE').map(p => p.new);
    const deletes = pendingUpdatesRef.current.filter(p => p.eventType === 'DELETE').map(p => p.old);
    
    // Create a new array from the current items
    const currentItems = [...items];
    
    // Create a map for faster lookups
    const itemsMap = new Map<string, FeedItem>();
    currentItems.forEach(item => itemsMap.set(item.id.toString(), item));
    
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
    const updatedItemsArray = Array.from(itemsMap.values());
    
    // Update the state with the new array
    setItems(updatedItemsArray);
    
    // Clear pending updates
    pendingUpdatesRef.current = [];
    setHasNewUpdates(false);
    
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
    setHasNewUpdates(true);
    
    // Clear any existing timer
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
    }
    
    // Schedule processing after a longer delay (batch updates over 10 seconds)
    updateTimerRef.current = setTimeout(() => {
      processPendingUpdates();
      updateTimerRef.current = null;
    }, 10000); // Increased from 5s to 10s to reduce frequency of updates
  }, [processPendingUpdates]);

  // Force process updates
  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdatesRef.current.length > 0) {
      processPendingUpdates();
    }
  }, [processPendingUpdates]);

  // Clean up any timers
  const cleanupTimers = useCallback(() => {
    if (updateTimerRef.current) {
      clearTimeout(updateTimerRef.current);
      updateTimerRef.current = null;
    }
  }, []);

  return {
    queueRealtimeUpdate,
    hasNewUpdates,
    applyPendingUpdates,
    cleanupTimers,
    lastUpdateTimeRef
  };
}
