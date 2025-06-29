
import { performanceMetrics } from "./metrics";

// Performance analytics and reporting
interface AnalyticsReport {
  timeRange: {
    start: number;
    end: number;
  };
  metrics: {
    avgPageLoad: number;
    avgApiRequest: number;
    avgComponentRender: number;
    memoryUsage: {
      average: number;
      peak: number;
    };
  };
  issues: {
    critical: number;
    warnings: number;
  };
  recommendations: string[];
}

class PerformanceAnalytics {
  generateReport(timeRangeMs = 3600000): AnalyticsReport { // Default: 1 hour
    const now = Date.now();
    const start = now - timeRangeMs;
    const metrics = performanceMetrics.getMetrics().filter(
      m => m.timestamp >= start && m.timestamp <= now
    );

    // Calculate averages
    const avgPageLoad = this.calculateAverage(metrics, 'page-load');
    const avgApiRequest = this.calculateAverage(metrics, 'api-request');
    const avgComponentRender = this.calculateAverage(metrics, 'component-render');
    
    // Memory analysis
    const memoryMetrics = metrics.filter(m => m.name === 'memory-usage');
    const avgMemory = memoryMetrics.length > 0 
      ? memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length
      : 0;
    const peakMemory = memoryMetrics.length > 0 
      ? Math.max(...memoryMetrics.map(m => m.value))
      : 0;

    // Count issues by severity
    const issues = this.countIssues(metrics);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations({
      avgPageLoad,
      avgApiRequest,
      avgComponentRender,
      avgMemory,
      peakMemory,
      issues
    });

    return {
      timeRange: { start, end: now },
      metrics: {
        avgPageLoad,
        avgApiRequest,
        avgComponentRender,
        memoryUsage: {
          average: avgMemory,
          peak: peakMemory
        }
      },
      issues,
      recommendations
    };
  }

  private calculateAverage(metrics: any[], name: string): number {
    const filtered = metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    return filtered.reduce((sum, m) => sum + m.value, 0) / filtered.length;
  }

  private countIssues(metrics: any[]) {
    const thresholds = {
      'page-load': { warning: 3000, critical: 5000 },
      'api-request': { warning: 1000, critical: 2000 },
      'component-render': { warning: 100, critical: 300 },
      'memory-usage': { warning: 50, critical: 80 }
    };

    let critical = 0;
    let warnings = 0;

    metrics.forEach(metric => {
      const threshold = thresholds[metric.name as keyof typeof thresholds];
      if (threshold) {
        if (metric.value >= threshold.critical) {
          critical++;
        } else if (metric.value >= threshold.warning) {
          warnings++;
        }
      }
    });

    return { critical, warnings };
  }

  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];

    if (data.avgPageLoad > 3000) {
      recommendations.push("Consider implementing code splitting to reduce bundle size");
    }

    if (data.avgApiRequest > 1000) {
      recommendations.push("API requests are slow - consider caching or optimizing queries");
    }

    if (data.avgComponentRender > 100) {
      recommendations.push("Component renders are slow - consider memoization with React.memo");
    }

    if (data.avgMemory > 50) {
      recommendations.push("High memory usage detected - check for memory leaks");
    }

    if (data.issues.critical > 0) {
      recommendations.push("Critical performance issues detected - immediate attention required");
    }

    if (recommendations.length === 0) {
      recommendations.push("Performance looks good! 🎉");
    }

    return recommendations;
  }

  exportMetrics(format: 'json' | 'csv' = 'json') {
    const metrics = performanceMetrics.getMetrics();
    
    if (format === 'csv') {
      const headers = ['timestamp', 'name', 'value', 'category', 'tags'];
      const csvData = [
        headers.join(','),
        ...metrics.map(m => [
          m.timestamp,
          m.name,
          m.value,
          m.category,
          JSON.stringify(m.tags || {})
        ].join(','))
      ].join('\n');
      
      return csvData;
    }
    
    return JSON.stringify(metrics, null, 2);
  }
}

export const performanceAnalytics = new PerformanceAnalytics();
