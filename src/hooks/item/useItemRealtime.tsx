
import { useState, useCallback, useEffect } from "react";
import { useItemRealtimeUpdates } from "./useItemRealtimeUpdates";
import { useToast } from "@/hooks/use-toast";

export const useItemRealtime = (itemId: string, refreshData: () => void) => {
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const { toast } = useToast();
  
  const handleReconnect = useCallback(() => {
    setConnectionAttempts(prev => prev + 1);
  }, []);
  
  const { isSubscribed, error: realtimeError, retry } = useItemRealtimeUpdates(
    itemId, 
    refreshData
  );

  // Effect to track subscription status
  useEffect(() => {
    if (isSubscribed && !isRealtimeSubscribed) {
      console.log(`Realtime subscription active for item ${itemId}`);
      setIsRealtimeSubscribed(true);
      
      // Show toast only after successful reconnection attempt
      if (connectionAttempts > 0) {
        toast({
          title: "Reconnected",
          description: "Live updates are now active",
        });
      }
    } else if (!isSubscribed && isRealtimeSubscribed) {
      console.log(`Realtime subscription lost for item ${itemId}`);
      setIsRealtimeSubscribed(false);
    }
  }, [isSubscribed, isRealtimeSubscribed, itemId, connectionAttempts, toast]);

  // Enhanced refresh with proper error handling
  const refreshItemData = useCallback(() => {
    try {
      console.log(`Manual refresh requested for item ${itemId}`);
      handleReconnect();
      retry();
      refreshData();
      return true;
    } catch (error) {
      console.error("Error refreshing item data:", error);
      toast({
        title: "Error refreshing",
        description: "Could not refresh the data. Please try again.",
        variant: "destructive"
      });
      return false;
    }
  }, [refreshData, itemId, retry, handleReconnect, toast]);

  return {
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData,
    connectionAttempts
  };
};
