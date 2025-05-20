
import { useState, useCallback, useRef, useMemo } from "react";
import { FeedItem } from "@/context/feed/types";
import { useToast } from "@/hooks/use-toast";

type FeedItemsMap = Record<string | number, FeedItem>;

interface NormalizedFeedState {
  byId: FeedItemsMap;
  allIds: (string | number)[];
}

export function useNormalizedFeedState() {
  // Initialize with a normalized structure for O(1) lookups
  const [normalizedState, setNormalizedState] = useState<NormalizedFeedState>({
    byId: {},
    allIds: []
  });
  
  const { toast } = useToast();
  const pendingUpdatesRef = useRef<Map<string | number, FeedItem>>(new Map());
  const pendingDeletesRef = useRef<Set<string | number>>(new Set());
  const updatesTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasNewUpdates, setHasNewUpdates] = useState(false);
  
  // Get a flat array of items from the normalized state (for compatibility)
  const items = useMemo(() => {
    return normalizedState.allIds.map(id => normalizedState.byId[id]);
  }, [normalizedState]);
  
  // Set the normalized state from a flat array
  const setItems = useCallback((newItems: FeedItem[]) => {
    const byId: FeedItemsMap = {};
    const allIds: (string | number)[] = [];
    
    // Normalize the array into a map with ID references
    newItems.forEach(item => {
      if (item && item.id) {
        byId[item.id] = item;
        allIds.push(item.id);
      }
    });
    
    setNormalizedState({ byId, allIds });
  }, []);
  
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
  }, [toast]);
  
  // Update a single item with immutable pattern
  const updateItem = useCallback((id: string | number, changes: Partial<FeedItem>) => {
    setNormalizedState(prevState => {
      // Skip if item doesn't exist
      if (!prevState.byId[id]) return prevState;
      
      return {
        ...prevState,
        byId: {
          ...prevState.byId,
          [id]: {
            ...prevState.byId[id],
            ...changes,
          }
        }
      };
    });
  }, []);
  
  // Delete a single item
  const deleteItem = useCallback((id: string | number) => {
    // First set transition state
    updateItem(id, { __transitionState: 'removing' });
    
    // After animation, remove from state
    setTimeout(() => {
      setNormalizedState(prevState => {
        const { [id]: removedItem, ...newById } = prevState.byId;
        return {
          byId: newById,
          allIds: prevState.allIds.filter(itemId => itemId !== id)
        };
      });
    }, 500);
  }, [updateItem]);
  
  // Archive an item
  const archiveItem = useCallback((id: string | number, reason?: string) => {
    // First set transition state
    updateItem(id, { 
      __transitionState: 'archiving',
      archived_at: new Date().toISOString(),
      archived_reason: reason
    });
    
    // After animation, set normal state
    setTimeout(() => {
      updateItem(id, { __transitionState: 'normal' });
    }, 500);
  }, [updateItem]);
  
  // Restore an item
  const restoreItem = useCallback((id: string | number) => {
    // First set transition state
    updateItem(id, { 
      __transitionState: 'restoring',
      archived_at: null,
      archived_reason: null
    });
    
    // After animation, set normal state
    setTimeout(() => {
      updateItem(id, { __transitionState: 'normal' });
    }, 500);
  }, [updateItem]);
  
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
    items,
    setItems,
    updateItem,
    deleteItem,
    archiveItem,
    restoreItem,
    queueRealtimeUpdate,
    queueRealtimeDelete,
    hasNewUpdates,
    applyPendingUpdates,
    cleanupTimers
  };
}
