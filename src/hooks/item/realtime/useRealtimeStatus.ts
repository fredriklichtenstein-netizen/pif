
import { useState, useEffect } from "react";

/**
 * Hook to handle real-time status tracking.
 * Realtime reconnection is handled silently per UX guidelines.
 */
export const useRealtimeStatus = (
  itemId: string,
  isSubscribed: boolean,
  connectionAttempts: number
) => {
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);

  useEffect(() => {
    if (isSubscribed && !isRealtimeSubscribed) {
      setIsRealtimeSubscribed(true);
    } else if (!isSubscribed && isRealtimeSubscribed) {
      setIsRealtimeSubscribed(false);
    }
  }, [isSubscribed, isRealtimeSubscribed, itemId, connectionAttempts]);

  return {
    isRealtimeSubscribed
  };
};
