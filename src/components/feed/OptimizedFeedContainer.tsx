
import { useState } from 'react';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { FeedItemList } from './FeedItemList';
import { FeedLoadingState } from './FeedLoadingState';
import { FeedErrorState } from './FeedErrorState';
import { FeedEmptyState } from './FeedEmptyState';
import { RealtimeIndicator } from './RealtimeIndicator';
import { PerformanceMonitor } from '@/components/debug/PerformanceMonitor';
import { usePerformanceMonitor } from '@/hooks/feed/usePerformanceMonitor';

export function OptimizedFeedContainer() {
  const { posts, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useOptimizedFeed();
  const { measureFetch } = usePerformanceMonitor('OptimizedFeedContainer');

  const handleRefresh = async () => {
    await measureFetch(refresh);
  };

  const handleLoadMore = async () => {
    await measureFetch(loadMore);
  };

  const handlePostUpdate = (updatedPosts: any[]) => {
    // Handle real-time post updates
    console.log('Posts updated via real-time:', updatedPosts.length);
  };

  if (isLoading) {
    return <FeedLoadingState />;
  }

  if (error) {
    return <FeedErrorState onRetry={handleRefresh} />;
  }

  if (posts.length === 0) {
    return <FeedEmptyState />;
  }

  return (
    <div className="space-y-4">
      <RealtimeIndicator posts={posts} onPostUpdate={handlePostUpdate} />
      
      <FeedItemList
        posts={posts}
        isLoadingMore={isLoadingMore}
        hasMore={hasMore}
        onLoadMore={handleLoadMore}
        onRefresh={handleRefresh}
      />
      
      <PerformanceMonitor />
    </div>
  );
}
