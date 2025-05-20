
import { useEffect, useCallback } from "react";
import { useFeedContext } from "@/context/feed";
import { useRealtimeUpdateQueue } from "./realtime/useRealtimeUpdateQueue";
import { useRealtimeSubscription } from "./realtime/useRealtimeSubscription";

export const useRealtimeFeed = () => {
  const { items, setItems } = useFeedContext();
  
  // Set up update queue management
  const {
    queueRealtimeUpdate,
    hasNewUpdates,
    applyPendingUpdates,
    cleanupTimers,
    lastUpdateTimeRef
  } = useRealtimeUpdateQueue(items, setItems);
  
  // Set up subscription management
  const {
    setupRealtimeSubscription,
    cleanupRealtimeSubscription,
    realtimeChannelRef
  } = useRealtimeSubscription();

  // Effect to set up the realtime subscription - with better conditional logic
  useEffect(() => {
    // Only set up if we have items and no existing subscription
    if (items.length > 0 && !realtimeChannelRef.current) {
      const handlePayload = (payload: any) => {
        const now = Date.now();
        // Much longer minimum time between updates (20s minimum between processing)
        if (now - lastUpdateTimeRef.current < 20000) {
          console.log('Update received too soon after last update, queueing');
          queueRealtimeUpdate(payload);
        } else {
          console.log('Processing update after sufficient delay');
          queueRealtimeUpdate(payload);
          lastUpdateTimeRef.current = now;
        }
      };
      
      return setupRealtimeSubscription(handlePayload);
    }
    return undefined;
  }, [items.length, setupRealtimeSubscription, queueRealtimeUpdate, lastUpdateTimeRef, realtimeChannelRef]);

  // Process any pending updates when component unmounts
  useEffect(() => {
    return () => {
      applyPendingUpdates();
      cleanupTimers();
      cleanupRealtimeSubscription();
    };
  }, [applyPendingUpdates, cleanupTimers, cleanupRealtimeSubscription]);

  // Return the functionality
  return {
    cleanupRealtimeSubscription,
    hasNewUpdates,
    applyPendingUpdates
  };
};
