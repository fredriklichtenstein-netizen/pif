
import { useRef, useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { FeedItem } from "@/context/feed/types";
import { NormalizedFeedState } from "./types";

export interface PendingUpdatesHook {
  queueRealtimeUpdate: (updatedItem: FeedItem) => void;
  queueRealtimeDelete: (itemId: string | number) => void;
  hasNewUpdates: boolean;
  applyPendingUpdates: () => void;
  cleanupTimers: () => void;
}

export function usePendingUpdates(
  setNormalizedState: React.Dispatch<React.SetStateAction<NormalizedFeedState>>
): PendingUpdatesHook {
  const { toast } = useToast();
  const pendingUpdatesRef = useRef<Map<string | number, FeedItem>>(new Map());
  const pendingDeletesRef = useRef<Set<string | number>>(new Set());
  const updatesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Function to queue a realtime update
  const queueRealtimeUpdate = useCallback((updatedItem: FeedItem) => {
    // Store in pending updates map
    pendingUpdatesRef.current.set(updatedItem.id, updatedItem);
    setHasNewUpdates(true);
    
    // Clear any existing timer
    if (updatesTimerRef.current) {
      clearTimeout(updatesTimerRef.current);
    }
    
    // Schedule processing after a delay to batch updates
    updatesTimerRef.current = setTimeout(() => {
      applyPendingUpdates();
      updatesTimerRef.current = null;
    }, 8000); // 8 second batch window
  }, []);
  
  // Queue a deletion
  const queueRealtimeDelete = useCallback((itemId: string | number) => {
    pendingDeletesRef.current.add(itemId);
    setHasNewUpdates(true);
    
    // Clear any existing timer
    if (updatesTimerRef.current) {
      clearTimeout(updatesTimerRef.current);
    }
    
    // Schedule processing after a delay
    updatesTimerRef.current = setTimeout(() => {
      applyPendingUpdates();
      updatesTimerRef.current = null;
    }, 8000); // 8 second batch window
  }, []);
  
  // Apply all pending updates
  const applyPendingUpdates = useCallback(() => {
    // Skip if no updates
    if (pendingUpdatesRef.current.size === 0 && pendingDeletesRef.current.size === 0) {
      return;
    }
    
    console.log(`Applying ${pendingUpdatesRef.current.size} updates and ${pendingDeletesRef.current.size} deletions`);
    
    setNormalizedState(prevState => {
      const newState = {
        byId: { ...prevState.byId },
        allIds: [...prevState.allIds]
      };
      
      // Apply updates
      pendingUpdatesRef.current.forEach((item, id) => {
        // Update existing item
        if (newState.byId[id]) {
          newState.byId[id] = {
            ...item,
            // Preserve UI state
            __transitionState: newState.byId[id]?.__transitionState || 'normal'
          };
        } 
        // Add new item
        else {
          newState.byId[id] = {
            ...item,
            __transitionState: 'normal'
          };
          newState.allIds.push(id);
        }
      });
      
      // Apply deletes
      pendingDeletesRef.current.forEach(id => {
        delete newState.byId[id];
        newState.allIds = newState.allIds.filter(itemId => itemId !== id);
      });
      
      // Show notification only for new items
      const newItemsCount = pendingUpdatesRef.current.size - pendingDeletesRef.current.size;
      if (newItemsCount > 0) {
        toast({
          title: "New content available",
          description: `${newItemsCount} new item${newItemsCount > 1 ? 's' : ''} added`,
          variant: "default",
        });
      }
      
      return newState;
    });
    
    // Clear pending updates
    pendingUpdatesRef.current.clear();
    pendingDeletesRef.current.clear();
    setHasNewUpdates(false);
    lastUpdateTimeRef.current = Date.now();
  }, [setNormalizedState, toast]);
  
  // Clean up function
  const cleanupTimers = useCallback(() => {
    if (updatesTimerRef.current) {
      clearTimeout(updatesTimerRef.current);
      updatesTimerRef.current = null;
    }
    
    // Apply any pending updates before cleanup
    if (pendingUpdatesRef.current.size > 0 || pendingDeletesRef.current.size > 0) {
      applyPendingUpdates();
    }
  }, [applyPendingUpdates]);
  
  return {
    queueRealtimeUpdate,
    queueRealtimeDelete,
    hasNewUpdates,
    applyPendingUpdates,
    cleanupTimers
  };
}
