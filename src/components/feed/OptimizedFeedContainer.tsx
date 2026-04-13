
import { useMemo, useCallback } from 'react';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { FeedItemList } from './FeedItemList';
import { FeedLoadingState } from './FeedLoadingState';
import { FeedErrorState } from './FeedErrorState';
import { FeedEmptyState } from './FeedEmptyState';
import { DemoModeBanner } from './DemoModeBanner';


import { usePerformanceMonitor } from '@/hooks/feed/usePerformanceMonitor';
import { useAnnouncement } from '@/hooks/accessibility/useAnnouncement';
import { useSwipeGestures } from '@/hooks/mobile/useSwipeGestures';
import { useVibration } from '@/hooks/mobile/useVibration';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { DEMO_MODE } from '@/config/demoMode';
import { useTranslation } from 'react-i18next';

export function OptimizedFeedContainer() {
  const { posts, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useOptimizedFeed();
  const { measureFetch } = usePerformanceMonitor('OptimizedFeedContainer');
  const { announce } = useAnnouncement();
  const { vibrate } = useVibration();
  const { t } = useTranslation();

  const memoizedPosts = useMemo(() => posts, [posts]);

  const handleRefresh = useCallback(async () => {
    announce(t('interactions.refreshing_feed'), "polite");
    await measureFetch(refresh);
    announce(t('interactions.feed_refreshed'), "polite");
  }, [announce, measureFetch, refresh, t]);

  const handleLoadMore = useCallback(async () => {
    announce(t('interactions.loading_more_posts'), "polite");
    await measureFetch(loadMore);
  }, [announce, measureFetch, loadMore, t]);

  const handlePostUpdate = useCallback((updatedPosts: any[]) => {
    announce(t('interactions.new_posts_available', { count: updatedPosts.length }), "polite");
  }, [announce, t]);

  useSwipeGestures({
    onSwipeDown: () => {
      if (!isLoading) {
        handleRefresh();
        vibrate(50);
      }
    }
  });

  if (DEMO_MODE) {
    return (
      <div className="space-y-4">
        <DemoModeBanner />
        <section role="feed" aria-label={t('interactions.community_posts_demo')}>
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
      <div role="status" aria-label={t('interactions.loading_feed')}>
        <EnhancedLoading size="lg" text={t('interactions.loading_feed')} />
      </div>
    );
  }

  if (error) {
    return (
      <FeedErrorState 
        errorMessage={error.message || t('interactions.error_label')} 
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
      <section role="feed" aria-label={t('interactions.community_posts')}>
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
        <div className="flex justify-center" role="navigation" aria-label={t('interactions.load_more_posts')}>
          <button
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 focus:ring-2 focus:ring-primary focus:ring-offset-2"
            aria-label={isLoadingMore ? t('interactions.loading_more') : t('interactions.load_more_posts')}
          >
            {isLoadingMore ? <EnhancedLoading size="sm" text={t('interactions.loading_more')} /> : t('interactions.load_more')}
          </button>
        </div>
      )}
      
      
    </div>
  );
}
