
import { useMemo, useCallback, useState } from 'react';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { FeedItemList } from './FeedItemList';
import { FeedLoadingState } from './FeedLoadingState';
import { FeedErrorState } from './FeedErrorState';
import { FeedEmptyState } from './FeedEmptyState';
import { DemoModeBanner } from './DemoModeBanner';
import { FeedDistanceFilter } from './FeedDistanceFilter';


import { usePerformanceMonitor } from '@/hooks/feed/usePerformanceMonitor';
import { useAnnouncement } from '@/hooks/accessibility/useAnnouncement';
import { useSwipeGestures } from '@/hooks/mobile/useSwipeGestures';
import { useVibration } from '@/hooks/mobile/useVibration';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { RefreshOverlay } from '@/components/common/RefreshOverlay';
import { FeedSkeleton } from './FeedSkeleton';
import { DEMO_MODE } from '@/config/demoMode';
import { useTranslation } from 'react-i18next';
import { useDistanceFiltering } from '@/hooks/useDistanceFiltering';
import { useLocationStorage } from '@/components/map/location/useLocationStorage';
import { useRefreshSyncStore } from '@/stores/refreshSyncStore';
import type { Post } from '@/types/post';

export function OptimizedFeedContainer() {
  const { posts, fadingIds, restoringIds, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useOptimizedFeed();
  const { measureFetch } = usePerformanceMonitor('OptimizedFeedContainer');
  const { announce } = useAnnouncement();
  const { vibrate } = useVibration();
  const { t } = useTranslation();

  // Shared with the map view (same localStorage key) so the user only
  // has to grant location once and the distance preference syncs.
  const { getStoredLocation } = useLocationStorage();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    () => getStoredLocation()
  );

  const memoizedPosts = useMemo(() => posts, [posts]);

  const { filteredPosts, selectedDistance, setSelectedDistance } =
    useDistanceFiltering({ posts: memoizedPosts as Post[], userLocation });

  // Single shared refresh action (announce + begin/end + try/finally)
  // — identical to the one used by the map view.
  const fetchFeed = useCallback(() => measureFetch(refresh), [measureFetch, refresh]);
  const { refresh: handleRefresh, isRefreshing } = useSharedRefresh(fetchFeed);

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
            fadingIds={fadingIds}
            restoringIds={restoringIds}
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
    <PullToRefresh onRefresh={handleRefresh} disabled={isLoading || isRefreshing}>
      <RefreshOverlay show={isRefreshing} />
      {/* While a refresh is in flight, neutralize all interactive
          children (filters, post actions, load-more button) so users
          can't fire likes/comments/new-post flows that would race the
          incoming data. `inert` blocks pointer + keyboard + focus. */}
      <div
        className={isRefreshing ? "space-y-4 opacity-60 pointer-events-none select-none" : "space-y-4"}
        aria-busy={isRefreshing}
        {...(isRefreshing ? { inert: "" as unknown as boolean } : {})}
      >
        <FeedDistanceFilter
          selectedDistance={selectedDistance}
          onDistanceChange={setSelectedDistance}
          userLocation={userLocation}
          onUserLocationChange={setUserLocation}
        />

        <section role="feed" aria-label={t('interactions.community_posts')}>
          {isRefreshing ? (
            <FeedSkeleton count={Math.min(3, Math.max(1, filteredPosts.length))} />
          ) : (
            <FeedItemList
              posts={filteredPosts}
              fadingIds={fadingIds}
              restoringIds={restoringIds}
              selectedCategories={[]}
              clearFilters={() => setSelectedDistance(null)}
              viewMode="all"
              isLoading={isLoadingMore}
              onItemOperationSuccess={handleRefresh}
            />
          )}
        </section>

        {/* Append skeleton placeholders while a "load more" page is in
            flight so the list visibly grows instead of freezing. */}
        {isLoadingMore && !isRefreshing && (
          <div aria-label={t('interactions.loading_more')} role="status">
            <FeedSkeleton count={2} />
          </div>
        )}

        {hasMore && (
          <div className="flex justify-center" role="navigation" aria-label={t('interactions.load_more_posts')}>
            <button
              onClick={handleLoadMore}
              disabled={isLoadingMore || isRefreshing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 focus:ring-2 focus:ring-primary focus:ring-offset-2"
              aria-label={isLoadingMore ? t('interactions.loading_more') : t('interactions.load_more_posts')}
            >
              {isLoadingMore ? <EnhancedLoading size="sm" text={t('interactions.loading_more')} /> : t('interactions.load_more')}
            </button>
          </div>
        )}
      </div>
    </PullToRefresh>
  );
}
