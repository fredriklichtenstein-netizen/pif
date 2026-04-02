
import { useCallback } from "react";
import { useRealtimeUpdates } from "./realtime/useRealtimeUpdates";
import { useRealtimeStatus } from "./realtime/useRealtimeStatus";
import { useRealtimeRefresh } from "./realtime/useRealtimeRefresh";

/**
 * Main hook for managing real-time functionality for an item
 */
export const useItemRealtime = (
  itemId: string,
  refreshData: () => void,
) => {
  // Enhanced cleanup function to ensure all resources are released
  const forceCleanup = useCallback(() => {
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
  
  // Set up real-time updates with debounce for better performance
  const {
    isSubscribed,
    error,
    cleanup,
    retry
  } = useRealtimeUpdates(itemId, refreshData, {
    maxAttempts: 3,
    debounceMs: 500
  });
  
  // Handle subscription status tracking and user notifications
  const {
    isRealtimeSubscribed
  } = useRealtimeStatus(itemId, isSubscribed, 0);
  
  // Handle refresh actions with error handling
  const {
    refreshItemData
  } = useRealtimeRefresh(itemId, refreshData, retry, () => {});
  
  // Combined cleanup function
  const combinedCleanup = useCallback(() => {
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

// Add missing import
import { supabase } from "@/integrations/supabase/client";
