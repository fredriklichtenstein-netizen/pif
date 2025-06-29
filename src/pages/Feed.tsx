
import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { performanceMetrics } from "@/services/performance/metrics";
import { useEffect } from "react";

export default function Feed() {
  useEffect(() => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      performanceMetrics.recordMetric({
        id: `feed-page-${Date.now()}`,
        name: 'page-load',
        value: duration,
        timestamp: Date.now(),
        category: 'render',
        tags: { page: 'feed' }
      });
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Feed</h1>
            <p className="text-gray-600">Discover what's happening in your community</p>
          </div>
          
          <OptimizedFeedContainer />
        </div>
      </main>
    </div>
  );
}
