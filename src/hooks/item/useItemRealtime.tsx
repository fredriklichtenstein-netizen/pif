
import { useState, useCallback } from "react";
import { useItemRealtimeUpdates } from "./useItemRealtimeUpdates";

export const useItemRealtime = (itemId: string, refreshData: () => void) => {
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);
  
  const { isSubscribed, error: realtimeError } = useItemRealtimeUpdates(
    itemId, 
    refreshData
  );

  const refreshItemData = useCallback(() => {
    refreshData();
  }, [refreshData]);

  return {
    isRealtimeSubscribed: isSubscribed,
    realtimeError,
    refreshItemData
  };
};
