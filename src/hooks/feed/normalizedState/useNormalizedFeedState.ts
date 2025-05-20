
import { useState, useRef } from "react";
import { FeedItem } from "@/context/feed/types";
import { useNormalizedState } from "./useNormalizedState";
import { usePendingUpdates } from "./usePendingUpdates";
import { NormalizedFeedState } from "./types";

export function useNormalizedFeedState() {
  // Initialize with a normalized structure
  const [normalizedState, setNormalizedState] = useState<NormalizedFeedState>({
    byId: {},
    allIds: []
  });
  
  // Get base normalized state operations
  const {
    items,
    setItems,
    updateItem,
    deleteItem,
    archiveItem,
    restoreItem
  } = useNormalizedState();

  // Get pending updates functionality
  const {
    queueRealtimeUpdate,
    queueRealtimeDelete,
    hasNewUpdates,
    applyPendingUpdates,
    cleanupTimers
  } = usePendingUpdates(setNormalizedState);
  
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
