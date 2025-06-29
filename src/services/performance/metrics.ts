// Performance metrics collection and analysis
interface PerformanceMetric {
  id: string;
  name: string;
  value: number;
  timestamp: number;
  category: 'render' | 'network' | 'memory' | 'user-interaction';
  tags?: Record<string, string>;
}

interface PerformanceThreshold {
  warning: number;
  critical: number;
}

class PerformanceMetricsCollector {
  private metrics: PerformanceMetric[] = [];
  private readonly MAX_METRICS = 1000;
  private observers: PerformanceObserver[] = [];
  
  private readonly thresholds: Record<string, PerformanceThreshold> = {
    'page-load': { warning: 3000, critical: 5000 },
    'api-request': { warning: 1000, critical: 2000 },
    'component-render': { warning: 100, critical: 300 },
    'memory-usage': { warning: 50, critical: 80 }, // MB
  };

  constructor() {
    this.setupPerformanceObservers();
    this.startMemoryMonitoring();
  }

  private setupPerformanceObservers() {
    if (typeof window === 'undefined') return;

    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navigationObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric({
              id: `nav-${Date.now()}`,
              name: 'page-load',
              value: navEntry.loadEventEnd - navEntry.navigationStart,
              timestamp: Date.now(),
              category: 'network',
              tags: { type: 'navigation' }
            });
          }
        }
      });
      
      try {
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);
      } catch (e) {
        console.warn('Navigation observer not supported');
      }
    }

    // Monitor resource loading
    if ('performance' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming;
            this.recordMetric({
              id: `resource-${Date.now()}`,
              name: 'resource-load',
              value: resourceEntry.responseEnd - resourceEntry.requestStart,
              timestamp: Date.now(),
              category: 'network',
              tags: { 
                type: 'resource',
                name: resourceEntry.name.split('/').pop() || 'unknown'
              }
            });
          }
        }
      });
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource observer not supported');
      }
    }
  }

  private startMemoryMonitoring() {
    if (typeof window === 'undefined') return;

    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const usedMB = memory.usedJSHeapSize / 1024 / 1024;
        
        this.recordMetric({
          id: `memory-${Date.now()}`,
          name: 'memory-usage',
          value: usedMB,
          timestamp: Date.now(),
          category: 'memory',
          tags: {
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024).toString(),
            limit: Math.round(memory.jsHeapSizeLimit / 1024 / 1024).toString()
          }
        });
      }
    };

    // Check memory every 30 seconds
    setInterval(checkMemory, 30000);
    checkMemory(); // Initial check
  }

  recordMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    
    // Keep only recent metrics
    if (this.metrics.length > this.MAX_METRICS) {
      this.metrics = this.metrics.slice(-this.MAX_METRICS);
    }
    
    // Check thresholds and alert if needed
    this.checkThresholds(metric);
    
    // Log in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`📊 Performance metric: ${metric.name} = ${metric.value.toFixed(2)}ms`);
    }
  }

  private checkThresholds(metric: PerformanceMetric) {
    const threshold = this.thresholds[metric.name];
    if (!threshold) return;

    if (metric.value >= threshold.critical) {
      console.error(`🚨 Critical performance issue: ${metric.name} took ${metric.value.toFixed(2)}ms`);
      this.reportCriticalIssue(metric);
    } else if (metric.value >= threshold.warning) {
      console.warn(`⚠️ Performance warning: ${metric.name} took ${metric.value.toFixed(2)}ms`);
    }
  }

  private reportCriticalIssue(metric: PerformanceMetric) {
    // In a real app, this would send to monitoring service
    if (typeof window !== 'undefined' && 'navigator' in window && 'sendBeacon' in navigator) {
      const data = JSON.stringify({
        type: 'performance-critical',
        metric,
        userAgent: navigator.userAgent,
        timestamp: Date.now()
      });
      
      try {
        navigator.sendBeacon('/api/performance-alert', data);
      } catch (e) {
        console.error('Failed to send performance alert');
      }
    }
  }

  getMetrics(category?: PerformanceMetric['category']) {
    return category 
      ? this.metrics.filter(m => m.category === category)
      : this.metrics;
  }

  getAverageMetric(name: string, timeWindow = 300000) { // 5 minutes
    const now = Date.now();
    const relevantMetrics = this.metrics.filter(
      m => m.name === name && (now - m.timestamp) <= timeWindow
    );
    
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, m) => acc + m.value, 0);
    return sum / relevantMetrics.length;
  }

  cleanup() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
  }
}

export const performanceMetrics = new PerformanceMetricsCollector();
