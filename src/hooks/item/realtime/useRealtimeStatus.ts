
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

/**
 * Hook to handle real-time status tracking and user notifications
 */
export const useRealtimeStatus = (
  itemId: string,
  isSubscribed: boolean,
  connectionAttempts: number
) => {
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);
  const { toast } = useToast();
  
  // Effect to track subscription status
  useEffect(() => {
    if (isSubscribed && !isRealtimeSubscribed) {
      setIsRealtimeSubscribed(true);
      
      // Show toast only after successful reconnection attempt
      if (connectionAttempts > 0) {
        toast({
          title: "Reconnected",
          description: "Live updates are now active",
        });
      }
    } else if (!isSubscribed && isRealtimeSubscribed) {
      setIsRealtimeSubscribed(false);
    }
  }, [isSubscribed, isRealtimeSubscribed, itemId, connectionAttempts, toast]);
  
  return {
    isRealtimeSubscribed
  };
};
