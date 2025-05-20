
import { useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useRealtimeSubscription() {
  const { toast } = useToast();
  const realtimeChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // Cleanup function for Supabase channel
  const cleanupRealtimeSubscription = useCallback(() => {
    if (realtimeChannelRef.current) {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(realtimeChannelRef.current);
      realtimeChannelRef.current = null;
    }
  }, []);

  // Setup realtime subscription
  const setupRealtimeSubscription = useCallback((queueRealtimeUpdate: (payload: any) => void) => {
    // Clean up any existing subscription
    cleanupRealtimeSubscription();

    console.log('Setting up realtime feed subscription');
    
    // Create a unique channel name
    const channelId = `feed-realtime-${Date.now()}`;
    
    // Create a channel for items table changes
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'items'
        }, 
        (payload) => {
          console.log('Realtime feed update received:', payload.eventType);
          queueRealtimeUpdate(payload);
        })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Realtime feed subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Realtime feed subscription error');
          toast({
            title: "Realtime updates unavailable",
            description: "Some updates may be delayed",
            variant: "destructive",
          });
        }
      });

    // Store the channel reference for cleanup
    realtimeChannelRef.current = channel;
    
    return cleanupRealtimeSubscription;
  }, [cleanupRealtimeSubscription, toast]);

  return {
    setupRealtimeSubscription,
    cleanupRealtimeSubscription,
    realtimeChannelRef
  };
}
