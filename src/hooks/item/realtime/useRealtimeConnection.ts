
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
      return;
    }
    channelsRef.current.forEach(channel => {
      try {
        supabase.removeChannel(channel);
      } catch (e) {
        console.error("Error removing channel:", e);
      }
    });
    
    // Reset all state
    channelsRef.current = [];
    setIsSubscribed(false);
    setupAttemptedRef.current = false;
    setConnectionAttempts(0);  
  }, [itemId]);

  // Handle reconnection attempts
  const handleReconnect = useCallback(() => {
    setConnectionAttempts(prev => prev + 1);
  }, []);

  // Handle component unmounting or item id change
  const handleCleanup = useCallback(() => {
    cleanupChannels();
    setIsSubscribed(false);
    setError(null);
    setConnectionAttempts(0);
  }, [cleanupChannels]);

  return {
    isSubscribed,
    error,
    connectionAttempts,
    setIsSubscribed,
    setError,
    cleanupChannels,
    handleReconnect,
    channelsRef,
    setupAttemptedRef,
    handleCleanup
  };
};
