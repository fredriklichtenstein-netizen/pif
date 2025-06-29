
// Memory optimization and monitoring utilities
class MemoryOptimizer {
  private cleanupTasks: (() => void)[] = [];
  private memoryPressureHandlers: (() => void)[] = [];

  constructor() {
    this.setupMemoryPressureDetection();
    this.scheduleCleanup();
  }

  private setupMemoryPressureDetection() {
    if (typeof window === 'undefined') return;

    // Check for memory pressure indicators
    const checkMemoryPressure = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        
        if (usedRatio > 0.85) { // 85% threshold
          console.warn(`🧠 High memory usage detected: ${(usedRatio * 100).toFixed(1)}%`);
          this.triggerMemoryCleanup();
        }
      }
    };

    setInterval(checkMemoryPressure, 10000); // Check every 10 seconds
  }

  private scheduleCleanup() {
    // Run cleanup every 5 minutes
    setInterval(() => {
      this.performRoutineCleanup();
    }, 5 * 60 * 1000);
  }

  private triggerMemoryCleanup() {
    console.log('🧹 Triggering memory cleanup...');
    this.memoryPressureHandlers.forEach(handler => {
      try {
        handler();
      } catch (e) {
        console.error('Memory pressure handler failed:', e);
      }
    });
  }

  private performRoutineCleanup() {
    this.cleanupTasks.forEach(task => {
      try {
        task();
      } catch (e) {
        console.error('Cleanup task failed:', e);
      }
    });
  }

  // Register cleanup tasks
  addCleanupTask(task: () => void) {
    this.cleanupTasks.push(task);
  }

  // Register memory pressure handlers
  addMemoryPressureHandler(handler: () => void) {
    this.memoryPressureHandlers.push(handler);
  }

  // Utility to debounce expensive operations
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  }

  // Utility to throttle operations
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Create a memoization cache with size limit
  createMemoCache<T>(maxSize = 100) {
    const cache = new Map<string, { value: T; timestamp: number }>();
    
    return {
      get: (key: string): T | undefined => {
        const entry = cache.get(key);
        if (entry) {
          // Update timestamp for LRU behavior
          entry.timestamp = Date.now();
          return entry.value;
        }
        return undefined;
      },
      set: (key: string, value: T) => {
        // Remove oldest entries if cache is full
        if (cache.size >= maxSize) {
          const oldestKey = [...cache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
          cache.delete(oldestKey);
        }
        
        cache.set(key, { value, timestamp: Date.now() });
      },
      clear: () => cache.clear(),
      size: () => cache.size
    };
  }

  getMemoryUsage() {
    if (typeof window === 'undefined' || !('memory' in performance)) {
      return null;
    }

    const memory = (performance as any).memory;
    return {
      used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
      total: Math.round(memory.totalJSHeapSize / 1024 / 1024),
      limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024),
      usagePercentage: Math.round((memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100)
    };
  }
}

export const memoryOptimizer = new MemoryOptimizer();
