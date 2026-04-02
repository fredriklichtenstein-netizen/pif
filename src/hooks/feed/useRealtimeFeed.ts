
import { useState, useEffect, useCallback } from 'react';
import { realtimeManager } from '@/services/performance/realtime';
import { performanceMetrics } from '@/services/performance/metrics';
import type { Post } from '@/types/post';

export function useRealtimeFeed(posts: Post[], onPostUpdate: (posts: Post[]) => void) {
  const [isRealtime, setIsRealtime] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');

  const handleRealtimeUpdate = useCallback((payload: any) => {
    const start = performance.now();
    
    try {
      // Handle different types of updates
      switch (payload.eventType) {
        case 'INSERT':
          // New post added
          // In a real implementation, we'd refetch or optimistically update
          break;
          
        case 'UPDATE':
          // Post updated
          // Update the specific post in the feed
          break;
          
        case 'DELETE':
          // Post deleted
          // Remove post from feed
          break;
      }
      
      const duration = performance.now() - start;
      performanceMetrics.recordMetric({
        id: `realtime-process-${Date.now()}`,
        name: 'realtime-processing',
        value: duration,
        timestamp: Date.now(),
        category: 'user-interaction',
        tags: { event: payload.eventType }
      });
    } catch (error) {
      console.error('Error processing realtime update:', error);
    }
  }, []);

  const startRealtime = useCallback(() => {
    if (isRealtime) return;
    
    setConnectionStatus('connecting');
    
    try {
      realtimeManager.subscribeToPostUpdates(handleRealtimeUpdate);
      realtimeManager.subscribeToInteractionUpdates(handleRealtimeUpdate);
      
      setIsRealtime(true);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Failed to enable real-time updates:', error);
      setConnectionStatus('disconnected');
    }
  }, [isRealtime, handleRealtimeUpdate]);

  const stopRealtime = useCallback(() => {
    if (!isRealtime) return;
    
    realtimeManager.cleanup();
    setIsRealtime(false);
    setConnectionStatus('disconnected');
  }, [isRealtime]);

  // Monitor connection health
  useEffect(() => {
    if (!isRealtime) return;
    
    const checkConnection = () => {
      const health = realtimeManager.getConnectionHealth();
      setConnectionStatus(health.isHealthy ? 'connected' : 'disconnected');
    };
    
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, [isRealtime]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRealtime) {
        stopRealtime();
      }
    };
  }, [isRealtime, stopRealtime]);

  return {
    isRealtime,
    connectionStatus,
    startRealtime,
    stopRealtime
  };
}
