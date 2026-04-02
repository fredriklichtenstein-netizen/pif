
import { useEffect, useRef } from 'react';
import { measurePerformance, logMemoryUsage } from '@/utils/performance';

interface PerformanceMetrics {
  renderTime: number;
  fetchTime: number;
  memoryUsage?: any;
}

export function usePerformanceMonitor(componentName: string) {
  const renderStartTime = useRef<number>(0);
  const metricsRef = useRef<PerformanceMetrics>({
    renderTime: 0,
    fetchTime: 0
  });

  useEffect(() => {
    renderStartTime.current = performance.now();
    
    return () => {
      const renderTime = performance.now() - renderStartTime.current;
      metricsRef.current.renderTime = renderTime;
      // Log memory usage in development
      if (process.env.NODE_ENV === 'development') {
        logMemoryUsage(`${componentName} render complete`);
      }
    };
  });

  const measureFetch = measurePerformance(`${componentName} data fetch`, async (fetchFn: () => Promise<any>) => {
    const start = performance.now();
    const result = await fetchFn();
    metricsRef.current.fetchTime = performance.now() - start;
    return result;
  });

  return {
    measureFetch,
    metrics: metricsRef.current
  };
}
