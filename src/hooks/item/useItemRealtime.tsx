
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
  
  return {
    isRealtimeSubscribed,
    realtimeError: error,
    refreshItemData,
    cleanup
  };
};
