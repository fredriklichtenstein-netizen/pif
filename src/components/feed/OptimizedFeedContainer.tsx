
import React, { memo, useCallback } from 'react';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { OptimizedList } from '@/components/ui/optimized-list';
import { FeedItemCard } from './FeedItemCard';
import { Loader2 } from 'lucide-react';
import { CardSkeleton } from '@/components/ui/skeleton';

const OptimizedFeedContainer = memo(function OptimizedFeedContainer() {
  const { 
    posts, 
    isLoading, 
    isLoadingMore, 
    hasMore, 
    loadMore, 
    refresh 
  } = useOptimizedFeed();

  const renderItem = useCallback((post: any, index: number) => (
    <FeedItemCard key={post.id} post={post} />
  ), []);

  const keyExtractor = useCallback((post: any, index: number) => post.id, []);

  const handleEndReached = useCallback(() => {
    if (hasMore && !isLoadingMore) {
      loadMore();
    }
  }, [hasMore, isLoadingMore, loadMore]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!posts.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No posts available</p>
        <button 
          onClick={refresh}
          className="mt-2 px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <OptimizedList
        items={posts}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        onEndReached={handleEndReached}
        containerHeight={window.innerHeight - 200}
        itemHeight={400}
      />
      
      {isLoadingMore && (
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      )}
      
      {!hasMore && posts.length > 0 && (
        <div className="text-center py-4 text-gray-500">
          No more posts to load
        </div>
      )}
    </div>
  );
});

export { OptimizedFeedContainer };
