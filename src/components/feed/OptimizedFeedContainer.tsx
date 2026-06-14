
import { useMemo, useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FeedProfileHeader } from './FeedProfileHeader';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { FeedItemList } from './FeedItemList';
import { FeedLoadingState } from './FeedLoadingState';
import { FeedErrorState } from './FeedErrorState';
import { FeedEmptyState } from './FeedEmptyState';
import { DemoModeBanner } from './DemoModeBanner';
import { FeedFiltersPanel } from './FeedFiltersPanel';


import { usePerformanceMonitor } from '@/hooks/feed/usePerformanceMonitor';
import { useAnnouncement } from '@/hooks/accessibility/useAnnouncement';
import { useSwipeGestures } from '@/hooks/mobile/useSwipeGestures';
import { useVibration } from '@/hooks/mobile/useVibration';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { PullToRefresh } from '@/components/common/PullToRefresh';
import { RefreshOverlay } from '@/components/common/RefreshOverlay';
import { FeedSkeleton } from './FeedSkeleton';
import { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
import { DEMO_MODE } from '@/config/demoMode';
import { useTranslation } from 'react-i18next';
import { useDistanceFiltering } from '@/hooks/useDistanceFiltering';
import { useLocationStorage } from '@/components/map/location/useLocationStorage';

import { useFeedFiltersStore } from '@/stores/feedFiltersStore';
import { applyPostFilters } from '@/utils/postFilters';
import { useMyInterestedIds } from '@/hooks/useMyInterestedIds';
import { useMyLikedIds } from '@/hooks/useMyLikedIds';
import { useMyInterestStore } from '@/stores/myInterestStore';
import { useMyLikedStore } from '@/stores/myLikedStore';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

import { useSharedRefresh } from '@/hooks/useSharedRefresh';
import type { Post } from '@/types/post';

export function OptimizedFeedContainer() {
  const { user } = useGlobalAuth();
  const isLoggedIn = !!user;
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredUserId = searchParams.get('user');
  const isOwnFilter = !!filteredUserId && filteredUserId === user?.id;
  const viewingOtherUser = !!filteredUserId && !isOwnFilter;

  const [includeArchived, setIncludeArchived] = useState(false);
  // Archived view only makes sense on own feed (own or no user filter).
  const effectiveIncludeArchived = isLoggedIn && includeArchived && !viewingOtherUser;
  const { posts, fadingIds, restoringIds, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } = useOptimizedFeed({ includeArchived: effectiveIncludeArchived });

  const clearUserFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('user');
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

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

  // Shared filter state with the /map view.
  const selectedCategories = useFeedFiltersStore((s) => s.categories);
  const selectedConditions = useFeedFiltersStore((s) => s.conditions);
  const selectedItemTypes = useFeedFiltersStore((s) => s.itemTypes);
  const onlyInterested = useFeedFiltersStore((s) => s.onlyInterested);
  const setCategories = useFeedFiltersStore((s) => s.setCategories);
  const setItemTypes = useFeedFiltersStore((s) => s.setItemTypes);
  const clearAllFilters = useFeedFiltersStore((s) => s.clearAll);

  const { ids: myInterestedIds, isLoaded: interestedIdsLoaded } = useMyInterestedIds();
  const { ids: myLikedIds, isLoaded: likedIdsLoaded } = useMyLikedIds();
  const [hydratedInteractionKey, setHydratedInteractionKey] = useState('');

  const fullyFilteredPosts = useMemo(() => {
    const base = applyPostFilters(
      filteredPosts,
      {
        categories: selectedCategories,
        conditions: selectedConditions,
        itemTypes: selectedItemTypes,
        onlyInterested: viewingOtherUser ? false : onlyInterested,
      },
      myInterestedIds,
    );
    return filteredUserId
      ? base.filter((p) => p.postedBy?.id === filteredUserId)
      : base;
  }, [
    filteredPosts,
    selectedCategories,
    selectedConditions,
    selectedItemTypes,
    onlyInterested,
    myInterestedIds,
    filteredUserId,
    viewingOtherUser,
  ]);


  const visiblePostIdsKey = useMemo(
    () => fullyFilteredPosts.map((post) => String(post.id)).join(','),
    [fullyFilteredPosts],
  );

  useEffect(() => {
    if (DEMO_MODE || isLoading || !likedIdsLoaded || !interestedIdsLoaded) return;

    const visibleIds = fullyFilteredPosts.map((post) => String(post.id));
    useMyLikedStore.getState().setMany(
      visibleIds.map((itemId) => ({ itemId, value: myLikedIds.has(itemId) })),
    );
    useMyInterestStore.getState().setMany(
      visibleIds.map((itemId) => ({ itemId, value: myInterestedIds.has(itemId) })),
    );
    setHydratedInteractionKey(visiblePostIdsKey);
  }, [
    fullyFilteredPosts,
    interestedIdsLoaded,
    isLoading,
    likedIdsLoaded,
    myInterestedIds,
    myLikedIds,
    visiblePostIdsKey,
  ]);

  // Interaction state is a nice-to-have — never gate the entire feed on it.
  // Buttons start neutral and fill in once hydration lands, but posts render
  // immediately so a stuck likes/interests fetch can't freeze the page.
  const interactionStateReady = true;

  // Single shared refresh action (announce + begin/end + try/finally)
  // — identical to the one used by the map view.
  const fetchFeed = useCallback(() => measureFetch(refresh), [measureFetch, refresh]);
  const { refresh: handleRefresh, isRefreshing } = useSharedRefresh(fetchFeed, "feed");

  const handleLoadMore = useCallback(async () => {
    announce(t('interactions.loading_more_posts'), "polite");
    await measureFetch(loadMore);
  }, [announce, measureFetch, loadMore, t]);

  useSwipeGestures({
    onSwipeDown: () => {
      if (!isLoading) {
        handleRefresh();
        vibrate(50);
      }
    }
  });

  const handleClearAll = useCallback(() => {
    clearAllFilters();
    setSelectedDistance(null);
  }, [clearAllFilters, setSelectedDistance]);

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

  const profileHeader = filteredUserId ? (
    <FeedProfileHeader userId={filteredUserId} onClear={clearUserFilter} />
  ) : null;

  const filtersPanel = (
    <FeedFiltersPanel
      posts={filteredPosts}
      selectedDistance={selectedDistance}
      onDistanceChange={setSelectedDistance}
      userLocation={userLocation}
      onUserLocationChange={setUserLocation}
      selectedItemTypes={selectedItemTypes}
      onItemTypeChange={setItemTypes}
      selectedCategories={selectedCategories}
      onCategoryChange={setCategories}
      includeArchived={includeArchived}
      onIncludeArchivedChange={setIncludeArchived}
      viewingOtherUser={viewingOtherUser}
      userFilterActive={!!filteredUserId}
      onResetAll={() => {
        handleClearAll();
        setUserLocation(null);
        setIncludeArchived(false);
        clearUserFilter();
      }}
    />
  );


  // Initial cold-load skeleton — only when we have literally nothing to show
  // AND no panel state worth preserving yet (panel hasn't been used).
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4" role="status" aria-label={t('interactions.loading_feed')} aria-busy="true">
        {filtersPanel}
        <FeedSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {filtersPanel}
        <FeedErrorState
          errorMessage={error.message || t('interactions.error_label')}
          onRetry={handleRefresh}
        />
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="space-y-4">
        {filtersPanel}
        <FeedEmptyState viewMode="all" selectedCategories={[]} clearFilters={() => {}} />
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handleRefresh} disabled={isLoading || isRefreshing}>
      <RefreshOverlay show={isRefreshing} />
      <div
        className={isRefreshing ? "space-y-4 opacity-60 pointer-events-none select-none" : "space-y-4"}
        aria-busy={isRefreshing}
        {...(isRefreshing ? { inert: "" as unknown as boolean } : {})}
      >
        {filtersPanel}



        <section role="feed" aria-label={t('interactions.community_posts')}>
          {isRefreshing ? (
            <FeedSkeleton count={Math.min(3, Math.max(1, fullyFilteredPosts.length))} />
          ) : (
            <FeedItemList
              posts={fullyFilteredPosts}
              fadingIds={fadingIds}
              restoringIds={restoringIds}
              selectedCategories={selectedCategories}
              clearFilters={handleClearAll}
              viewMode="all"
              isLoading={false}
              onItemOperationSuccess={(_id, op) => {
                if (op === 'archive' || op === 'delete' || op === 'restore') return;
                handleRefresh();
              }}
            />
          )}
        </section>

        {isLoadingMore && !isRefreshing && (
          <div aria-label={t('interactions.loading_more')} role="status">
            <FeedSkeleton count={2} />
          </div>
        )}

        <InfiniteScrollSentinel
          hasMore={!!hasMore}
          isLoading={isLoadingMore || isRefreshing}
          onLoadMore={handleLoadMore}
        />

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
