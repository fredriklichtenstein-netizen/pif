
import { useState, useEffect, useCallback } from "react";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedLoadingState } from "@/components/feed/FeedLoadingState";
import { VirtualizedFeedList } from "./VirtualizedFeedList";
import { FEED_CATEGORIES } from "./utils/constants";
import { useNormalizedFeedState } from "@/hooks/feed/useNormalizedFeedState";
import { useConsolidatedRealtimeFeed } from "@/hooks/feed/useConsolidatedRealtimeFeed";
import { useFeedPosts } from "@/hooks/feed/useFeedPosts";
import { useFeedViewMode } from "@/hooks/feed/useFeedViewMode";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export function FeedContent() {
  // Set up feed state with normalized data structure
  const feedState = useNormalizedFeedState();
  const { 
    items, 
    setItems, 
    queueRealtimeUpdate, 
    queueRealtimeDelete,
    hasNewUpdates,
    applyPendingUpdates,
    cleanupTimers
  } = feedState;
  
  // Set up filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [errorState, setErrorState] = useState({ hasError: false, errorMessage: '' });
  
  // Auth state
  const { user } = useGlobalAuth();
  
  // Set up consolidated realtime subscription
  const { isSubscribed } = useConsolidatedRealtimeFeed({
    queueRealtimeUpdate,
    queueRealtimeDelete
  });
  
  // Set up posts loading with the feed API
  const { 
    posts: rawPosts, 
    isLoading,
    error,
    refreshPosts, 
    filterByCategories,
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts,
  } = useFeedPosts();
  
  // Setup view mode logic
  const { viewMode, setViewMode, loadPostsBasedOnViewMode } = useFeedViewMode({
    user,
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts,
    refreshPosts
  });
  
  // Update feed state when raw posts change
  useEffect(() => {
    if (rawPosts && rawPosts.length > 0) {
      setItems(rawPosts);
    }
  }, [rawPosts, setItems]);
  
  // Handle error state updates
  useEffect(() => {
    if (error) {
      setErrorState({ 
        hasError: true, 
        errorMessage: error instanceof Error ? error.message : 'Failed to load posts' 
      });
    } else {
      setErrorState({ hasError: false, errorMessage: '' });
    }
  }, [error]);
  
  // Filter items when categories change
  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);
  
  // Initial load
  useEffect(() => {
    const initialLoadTimer = setTimeout(() => {
      refreshPosts().then(() => {
        setIsInitialLoad(false);
      });
    }, 500);
    
    return () => {
      clearTimeout(initialLoadTimer);
      cleanupTimers();
    };
  }, [refreshPosts, cleanupTimers]);
  
  // Define clearFilters function
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);
  
  // Enhanced handler for item operations
  const handleItemOperationSuccess = useCallback((itemId?: string | number, operationType?: OperationType) => {
    console.log("Operation success:", operationType, itemId);
    // When an item is updated, schedule a delayed fetch for latest data
    if (itemId && operationType) {
      setTimeout(() => {
        refreshPosts();
      }, 1000);
    }
  }, [refreshPosts]);

  if (isLoading && isInitialLoad) {
    return <FeedLoadingState />;
  }

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <NetworkStatus onRetry={refreshPosts} />
      <FeedHeader />

      {/* Notification for new content */}
      {hasNewUpdates && (
        <button
          onClick={applyPendingUpdates}
          className="w-full bg-green-50 py-2 mt-2 mb-3 text-sm text-green-700 
                    flex items-center justify-center gap-2 rounded-md shadow-sm border border-green-100"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" 
               stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" 
               className="animate-bounce">
            <path d="m18 15-6-6-6 6"/>
          </svg>
          New updates available. Tap to refresh
        </button>
      )}

      {/* Filters component */}
      <FeedFilters
        categories={FEED_CATEGORIES}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        allSelected={selectedCategories.length === FEED_CATEGORIES.length}
        showFilters={showFilters}
        setShowFilters={setShowFilters}
        viewMode={viewMode}
        setViewMode={setViewMode}
      />

      {/* Virtualized list component */}
      <VirtualizedFeedList
        posts={items}
        selectedCategories={selectedCategories}
        clearFilters={clearFilters}
        viewMode={viewMode}
        isLoading={isLoading && !isInitialLoad}
        errorState={errorState}
        onRetry={refreshPosts}
        onItemOperationSuccess={handleItemOperationSuccess}
      />
    </div>
  );
}
