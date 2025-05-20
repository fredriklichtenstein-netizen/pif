
import { useCallback, useRef } from "react";
import { useRealtimeUpdates } from "./realtime/useRealtimeUpdates";
import { useRealtimeStatus } from "./realtime/useRealtimeStatus";
import { useRealtimeRefresh } from "./realtime/useRealtimeRefresh";
import { supabase } from "@/integrations/supabase/client";

/**
 * Main hook for managing real-time functionality for an item
 * with improved performance and reduced re-renders
 */
export const useItemRealtime = (
  itemId: string,
  refreshData: () => void,
) => {
  // Tracking last refresh time to avoid excessive refreshes
  const lastRefreshTimeRef = useRef(Date.now());
  const refreshThreshold = 15000; // 15 seconds between refreshes
  
  // Wrap the refresh function to prevent excessive refreshes
  const throttledRefresh = useCallback(() => {
    const now = Date.now();
    if (now - lastRefreshTimeRef.current > refreshThreshold) {
      console.log(`Refreshing item ${itemId} after sufficient delay`);
      refreshData();
      lastRefreshTimeRef.current = now;
    } else {
      console.log(`Skipping refresh for item ${itemId} due to throttling`);
    }
  }, [itemId, refreshData, refreshThreshold]);

  // Enhanced cleanup function to ensure all resources are released
  const forceCleanup = useCallback(() => {
    console.log(`Force cleaning up all realtime resources for item ${itemId}`);
    
    try {
      // Get all Supabase channels
      const allChannels = supabase.getChannels();
      
      // Remove any channels related to this item
      const itemChannels = allChannels.filter(channel => 
        channel.topic.includes('item-') && channel.topic.includes(itemId)
      );
      
      itemChannels.forEach(channel => {
        try {
          supabase.removeChannel(channel);
        } catch (err) {
          console.error("Error removing channel:", err);
        }
      });
    } catch (error) {
      console.error("Error during force cleanup:", error);
    }
  }, [itemId]);
  
  // Set up real-time updates with increased debounce for better performance
  const {
    isSubscribed,
    error,
    cleanup,
    retry
  } = useRealtimeUpdates(itemId, throttledRefresh, {
    maxAttempts: 2,
    debounceMs: 2000  // Increased debounce time
  });
  
  // Handle subscription status tracking and user notifications
  const {
    isRealtimeSubscribed
  } = useRealtimeStatus(itemId, isSubscribed, 0);
  
  // Handle refresh actions with error handling
  const {
    refreshItemData
  } = useRealtimeRefresh(itemId, throttledRefresh, retry, () => {});
  
  // Combined cleanup function
  const combinedCleanup = useCallback(() => {
    console.log(`Cleaning up realtime for item ${itemId}`);
    cleanup();
    forceCleanup();
  }, [cleanup, forceCleanup, itemId]);
  
  return {
    isRealtimeSubscribed,
    realtimeError: error,
    refreshItemData,
    cleanup: combinedCleanup
  };
};
