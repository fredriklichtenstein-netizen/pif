
import { OptimizedFeedContainer } from "@/components/feed/OptimizedFeedContainer";
import { MainHeader } from "@/components/layout/MainHeader";
import { Separator } from "@/components/ui/separator";
import { performanceMetrics } from "@/services/performance/metrics";
import { useEffect } from "react";
import { FadeIn } from "@/components/animation/FadeIn";
import { SlideIn } from "@/components/animation/SlideIn";
import { useAnnouncement } from "@/hooks/accessibility/useAnnouncement";

export default function Feed() {
  const { announce } = useAnnouncement();

  useEffect(() => {
    const start = performance.now();
    
    // Announce page load for screen readers
    announce("Feed page loaded, showing community posts");
    
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
  }, [announce]);

  return (
    <div className="min-h-screen bg-gray-50">
      <MainHeader />
      <Separator />
      
      <main className="container mx-auto px-4 py-6" role="main" aria-label="Community feed">
        <div className="max-w-2xl mx-auto">
          <FadeIn>
            <header className="mb-6">
              <SlideIn direction="down">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Feed</h1>
              </SlideIn>
              <SlideIn direction="down" delay={100}>
                <p className="text-gray-600">Discover what's happening in your community</p>
              </SlideIn>
            </header>
          </FadeIn>
          
          <SlideIn direction="up" delay={200}>
            <OptimizedFeedContainer />
          </SlideIn>
        </div>
      </main>
    </div>
  );
}
