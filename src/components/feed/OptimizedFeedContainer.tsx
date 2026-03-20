
import { useMemo, useCallback } from 'react';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { FeedItemList } from './FeedItemList';
import { FeedLoadingState } from './FeedLoadingState';
import { FeedErrorState } from './FeedErrorState';
import { FeedEmptyState } from './FeedEmptyState';
import { DemoModeBanner } from './DemoModeBanner';
import { RealtimeIndicator } from './RealtimeIndicator';

import { usePerformanceMonitor } from '@/hooks/feed/usePerformanceMonitor';
import { useAnnouncement } from '@/hooks/accessibility/useAnnouncement';
import { useSwipeGestures } from '@/hooks/mobile/useSwipeGestures';
import { useVibration } from '@/hooks/mobile/useVibration';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { DEMO_MODE } from '@/config/demoMode';

export function OptimizedFeedContainer() {
  const { posts, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useOptimizedFeed();
  const { measureFetch } = usePerformanceMonitor('OptimizedFeedContainer');
  const { announce } = useAnnouncement();
  const { vibrate } = useVibration();

  // Memoize posts to prevent unnecessary re-renders and reduce API calls
  const memoizedPosts = useMemo(() => posts, [posts]);

  // Memoize callbacks to prevent FeedItemList re-renders
  const handleRefresh = useCallback(async () => {
    announce("Refreshing feed", "polite");
    await measureFetch(refresh);
    announce("Feed refreshed", "polite");
  }, [announce, measureFetch, refresh]);

  const handleLoadMore = useCallback(async () => {
    announce("Loading more posts", "polite");
    await measureFetch(loadMore);
  }, [announce, measureFetch, loadMore]);

  const handlePostUpdate = useCallback((updatedPosts: any[]) => {
    // Handle real-time post updates
    console.log('Posts updated via real-time:', updatedPosts.length);
    announce(`${updatedPosts.length} new posts available`, "polite");
  }, [announce]);

  // Swipe gestures for mobile
  useSwipeGestures({
    onSwipeDown: () => {
      if (!isLoading) {
        handleRefresh();
        vibrate(50); // Short vibration feedback
      }
    }
  });

  // In demo mode, show demo banner and mock posts
  if (DEMO_MODE) {
    return (
      <div className="space-y-4">
        <DemoModeBanner />
        <section role="feed" aria-label="Community posts (demo)">
          <FeedItemList
            posts={memoizedPosts}
            selectedCategories={[]}
            clearFilters={() => {}}
            viewMode="all"
            isLoading={false}
            isShowingMockData={true}
          />
        </section>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div role="status" aria-label="Loading feed">
        <EnhancedLoading size="lg" text="Loading your community feed..." />
      </div>
    );
  }

  if (error) {
    return (
      <FeedErrorState 
        errorMessage={error.message || 'An error occurred'} 
        onRetry={handleRefresh} 
      />
    );
  }

  if (posts.length === 0) {
    return (
      <FeedEmptyState 
        viewMode="all" 
        selectedCategories={[]} 
        clearFilters={() => {}} 
      />
    );
  }

  return (
    <div className="space-y-4">
      <RealtimeIndicator posts={posts} onPostUpdate={handlePostUpdate} />
      
      <section role="feed" aria-label="Community posts">
        <FeedItemList
          posts={memoizedPosts}
          selectedCategories={[]}
          clearFilters={() => {}}
          viewMode="all"
          isLoading={isLoadingMore}
          onItemOperationSuccess={handleRefresh}
        />
      </section>
      
      {hasMore && (
        <div className="flex justify-center" role="navigation" aria-label="Load more posts">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isLoadingMore ? "Loading more posts..." : "Load more posts"}
          >
            {isLoadingMore ? <EnhancedLoading size="sm" text="Loading..." /> : 'Load More'}
          </button>
        </div>
      )}
      
      
    </div>
  );
}
