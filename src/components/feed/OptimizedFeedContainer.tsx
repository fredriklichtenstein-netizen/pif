
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
    return <FeedErrorState errorMessage={error.message || 'An error occurred'} onRetry={handleRefresh} />;
  }

  if (posts.length === 0) {
    return <FeedEmptyState viewMode="all" selectedCategories={[]} clearFilters={() => {}} />;
  }

  return (
    <div className="space-y-4">
      <RealtimeIndicator posts={posts} onPostUpdate={handlePostUpdate} />
      
      <FeedItemList
        posts={posts}
        selectedCategories={[]}
        clearFilters={() => {}}
        viewMode="all"
        isLoading={isLoadingMore}
        onItemOperationSuccess={handleRefresh}
      />
      
      {hasMore && (
        <div className="flex justify-center">
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
      
      <PerformanceMonitor />
    </div>
  );
}
