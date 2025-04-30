
import { useRealtimeUpdates } from "./realtime/useRealtimeUpdates";
import { useRealtimeConnection } from "./realtime/useRealtimeConnection";
import { useRealtimeStatus } from "./realtime/useRealtimeStatus";
import { useRealtimeRefresh } from "./realtime/useRealtimeRefresh";

/**
 * Main hook for managing real-time updates for an item
 * This combines multiple smaller hooks for better separation of concerns
 */
export const useItemRealtime = (itemId: string, refreshData: () => void) => {
  // Get connection management utilities
  const { 
    connectionAttempts, 
    handleReconnect 
  } = useRealtimeConnection(itemId);
  
  // Handle real-time subscription
  const { 
    isSubscribed, 
    error: realtimeError, 
    retry 
  } = useRealtimeUpdates(
    itemId, 
    refreshData
  );

  // Track subscription status and handle notifications
  const { 
    isRealtimeSubscribed 
  } = useRealtimeStatus(
    itemId,
    isSubscribed,
    connectionAttempts
  );

  // Handle refresh functionality with error handling
  const { 
    refreshItemData 
  } = useRealtimeRefresh(
    itemId,
    refreshData,
    retry,
    handleReconnect
  );

  return {
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData,
    connectionAttempts
  };
};
