
import { useState, useCallback, useMemo } from "react";
import { FeedItem } from "@/context/feed/types";
import { NormalizedFeedState, NormalizedStateHook } from "./types";

export function useNormalizedState(): NormalizedStateHook {
  // Initialize with a normalized structure for O(1) lookups
  const [normalizedState, setNormalizedState] = useState<NormalizedFeedState>({
    byId: {},
    allIds: []
  });
  
  // Get a flat array of items from the normalized state (for compatibility)
  const items = useMemo(() => {
    return normalizedState.allIds.map(id => normalizedState.byId[id]);
  }, [normalizedState]);
  
  // Set the normalized state from a flat array
  const setItems = useCallback((newItems: FeedItem[]) => {
    const byId: Record<string | number, FeedItem> = {};
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
  
  return {
    items,
    setItems,
    updateItem,
    deleteItem,
    archiveItem,
    restoreItem,
  };
}
