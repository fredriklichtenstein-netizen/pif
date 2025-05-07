
import { useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to manage real-time connection status for an item
 */
export const useRealtimeConnection = (itemId: string) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const channelsRef = useRef<any[]>([]);
  const setupAttemptedRef = useRef(false);
  
  // Clean up function to remove all channels
  const cleanupChannels = useCallback(() => {
    if (channelsRef.current.length === 0) {
      console.log(`No channels to clean up for item ${itemId}`);
      return;
    }
    
    console.log(`Cleaning up ${channelsRef.current.length} channels for item ${itemId}`);
    
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.error("Error removing channel:", e);
      }
    });
    
    channelsRef.current = [];
    setIsSubscribed(false);
    setupAttemptedRef.current = false;
  }, [itemId]);

  // Handle reconnection attempts
  const handleReconnect = useCallback(() => {
    setConnectionAttempts(prev => prev + 1);
  }, []);

  return {
    isSubscribed,
    error,
    connectionAttempts,
    setIsSubscribed,
    setError,
    cleanupChannels,
    handleReconnect,
    channelsRef,
    setupAttemptedRef
  };
};
