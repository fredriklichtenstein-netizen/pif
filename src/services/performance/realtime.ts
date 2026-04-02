
import { supabase } from "@/integrations/supabase/client";
import { performanceMetrics } from "./metrics";

// Real-time performance monitoring and updates
class RealtimePerformanceManager {
  private channels: Map<string, any> = new Map();
  private connectionHealth = {
    connected: false,
    lastHeartbeat: 0,
    reconnectAttempts: 0
  };

  constructor() {
    this.setupConnectionMonitoring();
  }

  private setupConnectionMonitoring() {
    // Monitor Supabase connection health
    const healthCheck = async () => {
      const start = performance.now();
      
      try {
        await supabase.from('profiles').select('id').limit(1);
        
        const duration = performance.now() - start;
        performanceMetrics.recordMetric({
          id: `db-health-${Date.now()}`,
          name: 'database-ping',
          value: duration,
          timestamp: Date.now(),
          category: 'network',
          tags: { type: 'health-check' }
        });
        
        this.connectionHealth.connected = true;
        this.connectionHealth.lastHeartbeat = Date.now();
        this.connectionHealth.reconnectAttempts = 0;
      } catch (error) {
        this.connectionHealth.connected = false;
        this.connectionHealth.reconnectAttempts++;
        
        console.warn(`Database connection lost. Reconnect attempts: ${this.connectionHealth.reconnectAttempts}`);
      }
    };

    // Health check every 30 seconds
    setInterval(healthCheck, 30000);
    healthCheck(); // Initial check
  }

  subscribeToPostUpdates(callback: (payload: any) => void) {
    const channelName = 'posts-realtime';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const start = performance.now();
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'items'
        },
        (payload) => {
          const duration = performance.now() - start;
          
          performanceMetrics.recordMetric({
            id: `realtime-${Date.now()}`,
            name: 'realtime-update',
            value: duration,
            timestamp: Date.now(),
            category: 'network',
            tags: { 
              event: payload.eventType,
              table: 'items'
            }
          });
          
          callback(payload);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          performanceMetrics.recordMetric({
            id: `realtime-sub-${Date.now()}`,
            name: 'realtime-subscription',
            value: performance.now() - start,
            timestamp: Date.now(),
            category: 'network',
            tags: { status: 'subscribed' }
          });
        }
      });

    this.channels.set(channelName, channel);
    return channel;
  }

  subscribeToInteractionUpdates(callback: (payload: any) => void) {
    const channelName = 'interactions-realtime';
    
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'interests'
        },
        callback
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comments'
        },
        callback
      )
      .subscribe();

    this.channels.set(channelName, channel);
    return channel;
  }

  getConnectionHealth() {
    return {
      ...this.connectionHealth,
      isHealthy: this.connectionHealth.connected && 
                 (Date.now() - this.connectionHealth.lastHeartbeat) < 60000 // 1 minute
    };
  }

  cleanup() {
    this.channels.forEach((channel) => {
      supabase.removeChannel(channel);
    });
    this.channels.clear();
  }
}

export const realtimeManager = new RealtimePerformanceManager();
