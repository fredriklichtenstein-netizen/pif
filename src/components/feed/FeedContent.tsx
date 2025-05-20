
import { useRealtimeFeed } from "@/hooks/feed/useRealtimeFeed";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedItemList } from "@/components/feed/FeedItemList";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedLoadingState } from "@/components/feed/FeedLoadingState";
import { useFeedState } from "./hooks/useFeedState";
import { FEED_CATEGORIES } from "./utils/constants";

export function FeedContent() {
  // Set up realtime feed updates with new hasNewUpdates flag
  const { hasNewUpdates, applyPendingUpdates } = useRealtimeFeed();
  
  const {
    selectedCategories,
    setSelectedCategories,
    showFilters,
    setShowFilters,
    viewMode,
    setViewMode,
    isInitialLoad,
    posts,
    isLoading,
    refreshPosts,
    clearFilters,
    handleItemOperationSuccess,
    hasNewData,
  } = useFeedState();

  // Combine realtime updates with manual updates
  const showUpdateNotification = hasNewUpdates || hasNewData;

  if (isLoading && isInitialLoad) {
    return <FeedLoadingState />;
  }

  return (
    <div className="container max-w-md mx-auto px-4 pb-20">
      <NetworkStatus onRetry={refreshPosts} />
      <FeedHeader />

      {/* Notification for new content */}
      {showUpdateNotification && (
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

      {/* ItemList component with memoization */}
      <FeedItemList
        posts={posts}
        selectedCategories={selectedCategories}
        clearFilters={clearFilters}
        viewMode={viewMode}
        onItemOperationSuccess={handleItemOperationSuccess}
        isLoading={isLoading && !isInitialLoad}
      />
    </div>
  );
}
