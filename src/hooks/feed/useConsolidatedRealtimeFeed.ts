
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FeedItem } from "@/context/feed/types";

interface ConsolidatedRealtimeFeedProps {
  queueRealtimeUpdate: (updatedItem: FeedItem) => void;
  queueRealtimeDelete: (itemId: string | number) => void;
}

export function useConsolidatedRealtimeFeed({
  queueRealtimeUpdate,
  queueRealtimeDelete
}: ConsolidatedRealtimeFeedProps) {
  const { toast } = useToast();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const isSubscribedRef = useRef(false);

  // Clean up function
  const cleanupChannel = useCallback(() => {
    if (channelRef.current) {
      console.log('Cleaning up realtime consolidated feed channel');
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
      isSubscribedRef.current = false;
    }
  }, []);

  // Process realtime payload
  const processRealtimePayload = useCallback((payload: any) => {
    console.log(`Received ${payload.eventType} event for item ${payload.new?.id || payload.old?.id}`);
    
    try {
      if (payload.eventType === 'DELETE') {
        // Handle deletion
        if (payload.old && payload.old.id) {
          queueRealtimeDelete(payload.old.id);
        }
      } else {
        // Handle insert or update
        if (payload.new) {
          // Process the measurements field - ensure it's an object
          const newItem = { ...payload.new };
          
          if (typeof newItem.measurements === 'string') {
            try {
              newItem.measurements = JSON.parse(newItem.measurements);
            } catch (e) {
              newItem.measurements = {} as Record<string, any>;
            }
          } else if (!newItem.measurements) {
            newItem.measurements = {} as Record<string, any>;
          }
          
          queueRealtimeUpdate(newItem as FeedItem);
        }
      }
    } catch (error) {
      console.error('Error processing realtime payload:', error);
    }
  }, [queueRealtimeUpdate, queueRealtimeDelete]);

  // Set up subscription
  useEffect(() => {
    if (channelRef.current || isSubscribedRef.current) return;
    
    console.log('Setting up consolidated realtime feed subscription');
    
    const channelId = `consolidated-feed-${Date.now()}`;
    const channel = supabase
      .channel(channelId)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'items'
      }, processRealtimePayload)
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Consolidated realtime feed subscription active');
          isSubscribedRef.current = true;
        } else if (status === 'CHANNEL_ERROR') {
          console.error('Consolidated realtime feed subscription error');
          toast({
            title: "Realtime updates unavailable",
            description: "Some updates may be delayed",
            variant: "destructive",
          });
          isSubscribedRef.current = false;
        }
      });
    
    channelRef.current = channel;
    
    // Cleanup on unmount
    return cleanupChannel;
  }, [processRealtimePayload, toast, cleanupChannel]);

  return {
    isSubscribed: isSubscribedRef.current,
    cleanupChannel
  };
}
