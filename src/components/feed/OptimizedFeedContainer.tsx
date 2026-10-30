
import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { FeedProfileHeader } from './FeedProfileHeader';
import { useOptimizedFeed } from '@/hooks/feed/useOptimizedFeed';
import { FeedItemList } from './FeedItemList';
import { FeedErrorState } from './FeedErrorState';
import { FeedEmptyState } from './FeedEmptyState';
import { DemoModeBanner } from './DemoModeBanner';
import { DEFAULT_DISTANCE, FeedFiltersPanel, type PostScope } from './FeedFiltersPanel';
import { FeedActiveFilterChips, type ActiveFilterChip } from './FeedActiveFilterChips';


import { usePerformanceMonitor } from '@/hooks/feed/usePerformanceMonitor';
import { useAnnouncement } from '@/hooks/accessibility/useAnnouncement';
import { EnhancedLoading } from '@/components/ui/enhanced-loading';
import { RefreshOverlay } from '@/components/common/RefreshOverlay';
import { FeedSkeleton } from './FeedSkeleton';
import { InfiniteScrollSentinel } from './InfiniteScrollSentinel';
import { DEMO_MODE } from '@/config/demoMode';
import { useTranslation } from 'react-i18next';
import { useDistanceFiltering } from '@/hooks/useDistanceFiltering';
import { useLocationStorage } from '@/components/map/location/useLocationStorage';
import { useLocationProvider } from '@/components/map/location/useLocationProvider';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useFeedFiltersStore } from '@/stores/feedFiltersStore';
import { applyPostFilters } from '@/utils/postFilters';
import { sortPosts, type FeedSortMode } from '@/utils/postSort';
import { useMyInterestedIds } from '@/hooks/useMyInterestedIds';
import { useMyLikedIds } from '@/hooks/useMyLikedIds';
import { useMyCommentedIds } from '@/hooks/useMyCommentedIds';
import { useFeedTypeCounts } from '@/hooks/feed/useFeedTypeCounts';
import { useMyInterestStore } from '@/stores/myInterestStore';
import { useMyLikedStore } from '@/stores/myLikedStore';
import { useMyCommentedStore } from '@/stores/myCommentedStore';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

import { useSharedRefresh } from '@/hooks/useSharedRefresh';
import { DraftsList } from '@/components/drafts/DraftsList';
import { DeepLinkedPost } from './DeepLinkedPost';
import { supabase } from '@/integrations/supabase/client';
import type { Post } from '@/types/post';

const FEED_SORT_STORAGE_KEY = 'feed_sort_mode';
const FEED_HIDE_INACTIVE_STORAGE_KEY = 'feed_hide_inactive';
/** How many extra pages a /feed?post=<id> link may load looking for its post. */
const MAX_DEEP_LINK_PAGES = 10;

export function OptimizedFeedContainer() {
  const { user } = useGlobalAuth();
  const isLoggedIn = !!user;
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filteredUserId = isLoggedIn ? searchParams.get('user') : null;
  const isOwnFilter = !!filteredUserId && filteredUserId === user?.id;
  const viewingOtherUser = !!filteredUserId && !isOwnFilter;

  // Unauthenticated visitors cannot view per-user filtered feeds.
  useEffect(() => {
    if (!isLoggedIn && searchParams.get('user')) {
      const next = new URLSearchParams(searchParams);
      next.delete('user');
      setSearchParams(next, { replace: true });
      navigate('/auth', { state: { from: '/feed' } });
    }
  }, [isLoggedIn, searchParams, setSearchParams, navigate]);

  // "Dölj ej aktiva": the feed shows active and non-active (archived/
  // completed) posts side by side unless the user hides the non-active
  // ones -- this replaced the old "Visa endast arkiverade" view. Non-active
  // posts are only shown to logged-in users. Session-persisted like sort.
  const [hideInactive, setHideInactiveState] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(FEED_HIDE_INACTIVE_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const setHideInactive = useCallback((value: boolean) => {
    setHideInactiveState(value);
    try {
      sessionStorage.setItem(FEED_HIDE_INACTIVE_STORAGE_KEY, value ? '1' : '0');
    } catch { /* best-effort */ }
  }, []);
  const includeInactive = isLoggedIn && !hideInactive;

  // Drafts view (?view=drafts) -- in the URL so emails, notifications and
  // the old /drafts route can link straight to it.
  const showDrafts = isLoggedIn && !viewingOtherUser && searchParams.get('view') === 'drafts';
  const setShowDrafts = useCallback((value: boolean) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set('view', 'drafts');
      next.delete('post');
    } else {
      next.delete('view');
    }
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  // /feed?post=<id> (notification/email/share links, after publishing):
  // look up the post's status first -- a non-active post needs the
  // include-inactive scope, so "Dölj ej aktiva" is switched off for it.
  // A post that can't be shown in place is pinned above the feed instead
  // (DeepLinkedPost), which also says so when it no longer exists.
  const targetPostId = DEMO_MODE ? null : searchParams.get('post');
  const [deepLinkTarget, setDeepLinkTarget] = useState<{ id: string; inactive: boolean } | null>(null);
  const [pinnedPostId, setPinnedPostId] = useState<string | null>(null);
  const pinPost = useCallback((id: string) => setPinnedPostId(id), []);
  const dismissPinnedPost = useCallback(() => {
    setPinnedPostId(null);
    const next = new URLSearchParams(searchParams);
    ['post', 'comment', 'selectReceiver'].forEach((k) => next.delete(k));
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    setPinnedPostId(null);
    if (!targetPostId) {
      setDeepLinkTarget(null);
      return;
    }
    if (!/^\d+$/.test(targetPostId)) {
      pinPost(targetPostId);
      return;
    }
    let cancelled = false;
    supabase
      .from('items')
      .select('pif_status, archived_at')
      .eq('id', Number(targetPostId))
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          pinPost(targetPostId);
          return;
        }
        const status = String(data.pif_status ?? '');
        const inactive = status === 'archived' || status === 'completed' || !!data.archived_at;
        if (inactive && !isLoggedIn) {
          // Non-active posts aren't in a logged-out visitor's feed.
          pinPost(targetPostId);
          return;
        }
        if (inactive) setHideInactive(false);
        setDeepLinkTarget({ id: targetPostId, inactive });
      });
    return () => {
      cancelled = true;
    };
  }, [targetPostId, isLoggedIn, pinPost, setHideInactive]);

  const bodyTargetPostId =
    deepLinkTarget && deepLinkTarget.id === targetPostId && (!deepLinkTarget.inactive || includeInactive)
      ? targetPostId
      : null;

  const clearUserFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('user');
    setSearchParams(next, { replace: false });
  }, [searchParams, setSearchParams]);

  const pinned = pinnedPostId && pinnedPostId === targetPostId ? (
    <DeepLinkedPost postId={pinnedPostId} isLoggedIn={isLoggedIn} onDismiss={dismissPinnedPost} />
  ) : null;

  // Key the inner body on the scope so toggling it fully unmounts
  // `useOptimizedFeed` (its React Query observer, realtime channel,
  // in-flight timers) BEFORE the new-scope body mounts and subscribes. This
  // guarantees only one feed instance is ever active, so the network log
  // never shows two scopes' requests racing side-by-side.
  return (
    <>
    {pinned && <div className="mb-4">{pinned}</div>}
    <OptimizedFeedBody
      key={includeInactive ? 'feed-all' : 'feed-active'}
      isLoggedIn={isLoggedIn}
      viewingOtherUser={viewingOtherUser}
      filteredUserId={filteredUserId}
      includeInactive={includeInactive}
      hideInactive={hideInactive}
      onHideInactiveChange={setHideInactive}
      onClearUserFilter={clearUserFilter}
      showDrafts={showDrafts}
      onShowDraftsChange={setShowDrafts}
      targetPostId={pinned ? null : bodyTargetPostId}
      onTargetPostMissing={pinPost}
    />
    </>
  );
}

interface OptimizedFeedBodyProps {
  isLoggedIn: boolean;
  viewingOtherUser: boolean;
  filteredUserId: string | null;
  /** Non-active posts are fetched and shown alongside active ones. */
  includeInactive: boolean;
  hideInactive: boolean;
  onHideInactiveChange: (value: boolean) => void;
  onClearUserFilter: () => void;
  showDrafts: boolean;
  onShowDraftsChange: (value: boolean) => void;
  /** Deep-linked post, set once it's known to belong in this body's bucket. */
  targetPostId: string | null;
  onTargetPostMissing: (id: string) => void;
}

function OptimizedFeedBody({
  isLoggedIn,
  viewingOtherUser,
  filteredUserId,
  includeInactive,
  hideInactive,
  onHideInactiveChange,
  onClearUserFilter,
  showDrafts,
  onShowDraftsChange,
  targetPostId,
  onTargetPostMissing,
}: OptimizedFeedBodyProps) {
  const { user: currentUser } = useGlobalAuth();
  const { posts, fadingIds, restoringIds, isLoading, isLoadingMore, error, hasMore, loadMore, refresh } =
    useOptimizedFeed({ includeInactive });

  // True all/pifs/wishes counts, independent of how many pages have been
  // paginated in locally — see useFeedTypeCounts.
  const { counts: feedTypeCounts } = useFeedTypeCounts(
    includeInactive,
    filteredUserId ?? undefined,
  );

  const { measureFetch } = usePerformanceMonitor('OptimizedFeedContainer');
  const { announce } = useAnnouncement();
  const { t } = useTranslation();

  // Shared with the map view (same localStorage key) so the user only
  // has to grant location once and the distance preference syncs.
  const { getStoredLocation, setStoredLocation } = useLocationStorage();
  const [userLocation, setUserLocation] = useState<[number, number] | null>(
    () => getStoredLocation()
  );

  // Trello: "Sort the feed on distance and/or on published time." Persisted
  // the same way useDistanceFiltering persists selectedDistance (plain
  // sessionStorage, not the shared feedFiltersStore) -- sort is feed-only,
  // the map view has no equivalent linear order to sort.
  const [sortBy, setSortByState] = useState<FeedSortMode>(() => {
    try {
      const raw = sessionStorage.getItem(FEED_SORT_STORAGE_KEY);
      return raw === 'distance' ? 'distance' : 'recent';
    } catch {
      return 'recent';
    }
  });
  const { startTracking } = useLocationProvider();
  const { toast } = useToast();

  const setSortBy = useCallback((mode: FeedSortMode) => {
    setSortByState(mode);
    try {
      sessionStorage.setItem(FEED_SORT_STORAGE_KEY, mode);
    } catch { /* best-effort */ }

    // Picking "distance" without a known location yet: request it via the
    // same geolocation flow FeedDistanceFilter already uses, rather than
    // silently no-op'ing the sort (sortPosts() falls back to server order
    // when userLocation is null, which would look like the option did
    // nothing). Persist to the SAME storage key the distance filter and
    // map view read, so granting it here also benefits those.
    if (mode === 'distance' && !userLocation) {
      startTracking(
        ({ coords }) => {
          setUserLocation(coords);
          setStoredLocation(coords);
        },
        (err) => {
          const description =
            err.code === err.PERMISSION_DENIED
              ? t('interactions.location_permission_description')
              : t('feed.sort_distance_needs_location');
          toast({ variant: 'destructive', description });
        },
      );
    }
  }, [userLocation, startTracking, toast, t]);

  const memoizedPosts = useMemo(() => posts, [posts]);

  const { filteredPosts, selectedDistance, setSelectedDistance } =
    useDistanceFiltering({ posts: memoizedPosts as Post[], userLocation });

  // Shared filter state with the /map view.
  const selectedCategories = useFeedFiltersStore((s) => s.categories);
  const selectedConditions = useFeedFiltersStore((s) => s.conditions);
  const selectedItemTypes = useFeedFiltersStore((s) => s.itemTypes);
  const onlyInterested = useFeedFiltersStore((s) => s.onlyInterested);
  const onlyOwnPosts = useFeedFiltersStore((s) => s.onlyOwnPosts);
  const setCategories = useFeedFiltersStore((s) => s.setCategories);
  const setItemTypes = useFeedFiltersStore((s) => s.setItemTypes);
  const setOnlyInterested = useFeedFiltersStore((s) => s.setOnlyInterested);
  const setOnlyOwnPosts = useFeedFiltersStore((s) => s.setOnlyOwnPosts);
  const clearAllFilters = useFeedFiltersStore((s) => s.clearAll);

  const { ids: myInterestedIds, isLoaded: interestedIdsLoaded } = useMyInterestedIds();
  const { ids: myLikedIds, isLoaded: likedIdsLoaded } = useMyLikedIds();
  const { ids: myCommentedIds, isLoaded: commentedIdsLoaded } = useMyCommentedIds();
  const [hydratedInteractionKey, setHydratedInteractionKey] = useState('');

  const fullyFilteredPosts = useMemo(() => {
    const base = applyPostFilters(
      filteredPosts,
      {
        categories: selectedCategories,
        conditions: selectedConditions,
        itemTypes: selectedItemTypes,
        onlyInterested: viewingOtherUser ? false : onlyInterested,
        onlyOwnPosts: viewingOtherUser ? false : onlyOwnPosts,
        currentUserId: currentUser?.id,
      },
      myInterestedIds,
    );
    // Defense-in-depth: enforce the archive boundary at the render layer so
    // no stale cache, prefetch, or realtime race can leak the wrong bucket
    // into the visible list. Terminal = archived OR completed OR archived_at.
    const isTerminal = (p: Post) => {
      const s = String((p as any).status ?? '');
      return s === 'archived' || s === 'completed' || !!p.archived_at;
    };
    const bucketed = includeInactive ? base : base.filter((p) => !isTerminal(p));
    return filteredUserId
      ? bucketed.filter((p) => p.postedBy?.id === filteredUserId)
      : bucketed;
  }, [
    filteredPosts,
    selectedCategories,
    selectedConditions,
    selectedItemTypes,
    onlyInterested,
    onlyOwnPosts,
    currentUser?.id,
    myInterestedIds,
    filteredUserId,
    viewingOtherUser,
    includeInactive,
  ]);

  // Trello: "Sort the feed on distance and/or on published time." A no-op
  // for 'recent' (the server query is already created_at DESC) -- see
  // sortPosts()'s own comment for why 'distance' is client-side, matching
  // the existing distance FILTER's architecture.
  const sortedPosts = useMemo(
    () => sortPosts(fullyFilteredPosts, sortBy, userLocation),
    [fullyFilteredPosts, sortBy, userLocation],
  );

  const visiblePostIdsKey = useMemo(
    () => sortedPosts.map((post) => String(post.id)).join(','),
    [sortedPosts],
  );

  useEffect(() => {
    if (DEMO_MODE || isLoading || !likedIdsLoaded || !interestedIdsLoaded || !commentedIdsLoaded) return;

    const visibleIds = sortedPosts.map((post) => String(post.id));
    useMyLikedStore.getState().setMany(
      visibleIds.map((itemId) => ({ itemId, value: myLikedIds.has(itemId) })),
    );
    useMyInterestStore.getState().setMany(
      visibleIds.map((itemId) => ({ itemId, value: myInterestedIds.has(itemId) })),
    );
    useMyCommentedStore.getState().setMany(
      visibleIds.map((itemId) => ({ itemId, value: myCommentedIds.has(itemId) })),
    );
    setHydratedInteractionKey(visiblePostIdsKey);
  }, [
    sortedPosts,
    interestedIdsLoaded,
    isLoading,
    likedIdsLoaded,
    commentedIdsLoaded,
    myInterestedIds,
    myLikedIds,
    myCommentedIds,
    visiblePostIdsKey,
  ]);

  // Single shared refresh action (announce + begin/end + try/finally)
  // — identical to the one used by the map view.
  const fetchFeed = useCallback(() => measureFetch(refresh), [measureFetch, refresh]);
  const { refresh: handleRefresh, isRefreshing } = useSharedRefresh(fetchFeed, "feed");

  const handleLoadMore = useCallback(async () => {
    announce(t('interactions.loading_more_posts'), "polite");
    await measureFetch(loadMore);
  }, [announce, measureFetch, loadMore, t]);

  const handleClearAll = useCallback(() => {
    clearAllFilters();
    setSelectedDistance(null);
  }, [clearAllFilters, setSelectedDistance]);

  // "Inlägg" in Filtrera: one choice over the own-posts / interested
  // filters (shared with the map) and the drafts view.
  const postScope: PostScope = showDrafts
    ? 'drafts'
    : onlyOwnPosts
      ? 'mine'
      : onlyInterested
        ? 'interested'
        : 'all';
  const setPostScope = useCallback((scope: PostScope) => {
    setOnlyOwnPosts(scope === 'mine');
    setOnlyInterested(scope === 'interested');
    if ((scope === 'drafts') !== showDrafts) onShowDraftsChange(scope === 'drafts');
  }, [setOnlyOwnPosts, setOnlyInterested, showDrafts, onShowDraftsChange]);

  const resetAll = useCallback(() => {
    handleClearAll();
    setUserLocation(null);
    onHideInactiveChange(false);
    setPostScope('all');
    onClearUserFilter();
  }, [handleClearAll, onHideInactiveChange, setPostScope, onClearUserFilter]);

  // Deep link: keep loading pages until the post is loaded, clear the
  // filters once if they're what hides it, and give up (-> pinned above
  // the feed) when it can't be found within MAX_DEEP_LINK_PAGES.
  const [deepLinkPagesLoaded, setDeepLinkPagesLoaded] = useState(0);
  const [scrollToPostId, setScrollToPostId] = useState<string | null>(null);
  const deepLinkResolvedRef = useRef<string | null>(null);
  const filtersClearedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!targetPostId || deepLinkResolvedRef.current === targetPostId) return;
    if (isLoading || isLoadingMore || isRefreshing) return;
    const matches = (p: Post) => String(p.id) === targetPostId;
    if (sortedPosts.some(matches)) {
      deepLinkResolvedRef.current = targetPostId;
      setScrollToPostId(targetPostId);
      return;
    }
    if (posts.some(matches)) {
      if (filtersClearedForRef.current !== targetPostId) {
        filtersClearedForRef.current = targetPostId;
        handleClearAll();
        setOnlyInterested(false);
        setOnlyOwnPosts(false);
        if (filteredUserId) onClearUserFilter();
        return;
      }
    } else if (hasMore && deepLinkPagesLoaded < MAX_DEEP_LINK_PAGES) {
      setDeepLinkPagesLoaded((n) => n + 1);
      loadMore();
      return;
    }
    deepLinkResolvedRef.current = targetPostId;
    onTargetPostMissing(targetPostId);
  }, [
    targetPostId,
    isLoading,
    isLoadingMore,
    isRefreshing,
    sortedPosts,
    posts,
    hasMore,
    deepLinkPagesLoaded,
    loadMore,
    handleClearAll,
    setOnlyInterested,
    setOnlyOwnPosts,
    filteredUserId,
    onClearUserFilter,
    onTargetPostMissing,
  ]);

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
    <FeedProfileHeader userId={filteredUserId} onClear={onClearUserFilter} />
  ) : null;

  const scopeIsPrivate = isLoggedIn && !viewingOtherUser;
  const filterChips: ActiveFilterChip[] = [
    ...(scopeIsPrivate && postScope !== 'all'
      ? [{ key: 'scope', label: t(`feed.scope_${postScope}`), onRemove: () => setPostScope('all') }]
      : []),
    ...(selectedItemTypes.length === 1
      ? [{
          key: 'type',
          label: selectedItemTypes[0] === 'offer' ? t('map_filters.pifs') : t('map_filters.wishes'),
          onRemove: () => setItemTypes([]),
        }]
      : []),
    ...selectedCategories.map((key) => ({
      key: `cat-${key}`,
      label: t(`categories.${key}`),
      onRemove: () => setCategories(selectedCategories.filter((c) => c !== key)),
    })),
    ...(selectedDistance !== null && selectedDistance !== DEFAULT_DISTANCE
      ? [{
          key: 'distance',
          label: t('feed.within_km', { km: selectedDistance, defaultValue: `Inom ${selectedDistance} km` }),
          onRemove: () => setSelectedDistance(null),
        }]
      : []),
    ...(scopeIsPrivate && hideInactive
      ? [{ key: 'inactive', label: t('feed.hide_inactive', 'Dölj ej aktiva'), onRemove: () => onHideInactiveChange(false) }]
      : []),
  ];

  const filtersPanel = (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <FeedFiltersPanel
          posts={filteredPosts}
          typeCounts={feedTypeCounts}
          selectedDistance={selectedDistance}
          onDistanceChange={setSelectedDistance}
          userLocation={userLocation}
          onUserLocationChange={setUserLocation}
          selectedItemTypes={selectedItemTypes}
          onItemTypeChange={setItemTypes}
          selectedCategories={selectedCategories}
          onCategoryChange={setCategories}
          postScope={postScope}
          onPostScopeChange={setPostScope}
          hideInactive={hideInactive}
          onHideInactiveChange={onHideInactiveChange}
          viewingOtherUser={viewingOtherUser}
          userFilterActive={!!filteredUserId}
          onResetAll={resetAll}
        />
        {/* Sort stays outside the sheet: it never narrows the result set. */}
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as FeedSortMode)}>
          <SelectTrigger
            className="h-9 w-auto gap-1.5 bg-background text-sm"
            aria-label={t('feed.sort_label', 'Sortera')}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">{t('feed.sort_recent', 'Senast publicerad')}</SelectItem>
            <SelectItem value="distance">{t('feed.sort_distance', 'Närmast mig')}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <FeedActiveFilterChips chips={filterChips} onClearAll={resetAll} />
    </div>
  );

  if (showDrafts) {
    return (
      <div className="space-y-4">
        {profileHeader}
        {filtersPanel}
        <DraftsList />
      </div>
    );
  }

  // Initial cold-load skeleton — only when we have literally nothing to show
  // AND no panel state worth preserving yet (panel hasn't been used).
  if (isLoading && posts.length === 0) {
    return (
      <div className="space-y-4" role="status" aria-label={t('interactions.loading_feed')} aria-busy="true">
        {profileHeader}
        {filtersPanel}
        <FeedSkeleton count={4} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        {profileHeader}
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
        {profileHeader}
        {filtersPanel}
        <FeedEmptyState viewMode="all" selectedCategories={[]} clearFilters={() => {}} />
      </div>
    );
  }

  return (
    <>
      <RefreshOverlay show={isRefreshing} />
      <div
        className={isRefreshing ? "space-y-4 opacity-60 pointer-events-none select-none" : "space-y-4"}
        aria-busy={isRefreshing}
        {...(isRefreshing ? { inert: "" as unknown as boolean } : {})}
      >
        {profileHeader}
        {filtersPanel}



        <section role="feed" aria-label={t('interactions.community_posts')}>
          {isRefreshing ? (
            <FeedSkeleton count={Math.min(3, Math.max(1, sortedPosts.length))} />
          ) : (
            <FeedItemList
              posts={sortedPosts}
              fadingIds={fadingIds}
              restoringIds={restoringIds}
              selectedCategories={selectedCategories}
              clearFilters={handleClearAll}
              viewMode="all"
              isLoading={false}
              scrollToPostId={scrollToPostId}
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
    </>
  );
}
