// Database performance monitoring
interface QueryMetrics {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
}

class DatabaseMonitor {
  private static metrics: QueryMetrics[] = [];
  private static readonly MAX_METRICS = 1000;
  
  static recordQuery(query: string, duration: number, success: boolean, error?: string) {
    this.metrics.push({
      query,
      duration,
      timestamp: Date.now(),
      success,
      error
    });
    
    // Keep only the most recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    // Log slow queries in development
    if (process.env.NODE_ENV === 'development' && duration > 1000) {
      console.warn(`🐌 Slow query detected (${duration}ms):`, query);
    }
  }
  
  static getMetrics(limit = 100) {
    return this.metrics.slice(-limit);
  }
  
  static getSlowQueries(threshold = 1000) {
    return this.metrics.filter(m => m.duration > threshold);
  }
  
  static getAverageQueryTime() {
    if (this.metrics.length === 0) return 0;
    const total = this.metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / this.metrics.length;
  }
  
  static getErrorRate() {
    if (this.metrics.length === 0) return 0;
    const errors = this.metrics.filter(m => !m.success).length;
    return (errors / this.metrics.length) * 100;
  }
}

// Wrapper to monitor query performance
export const monitorQuery = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const start = performance.now();
  let success = true;
  let error: string | undefined;
  
  try {
    const result = await queryFn();
    return result;
  } catch (err) {
    success = false;
    error = err instanceof Error ? err.message : 'Unknown error';
    throw err;
  } finally {
    const duration = performance.now() - start;
    DatabaseMonitor.recordQuery(queryName, duration, success, error);
  }
};

export { DatabaseMonitor };
