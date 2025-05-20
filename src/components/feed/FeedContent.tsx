
import { useRealtimeFeed } from "@/hooks/feed/useRealtimeFeed";
import { NetworkStatus } from "@/components/common/NetworkStatus";
import { FeedFilters } from "@/components/feed/FeedFilters";
import { FeedItemList } from "@/components/feed/FeedItemList";
import { FeedHeader } from "@/components/feed/FeedHeader";
import { FeedLoadingState } from "@/components/feed/FeedLoadingState";
import { useFeedState } from "./hooks/useFeedState";
import { FEED_CATEGORIES } from "./utils/constants";

export function FeedContent() {
  // Set up realtime feed updates
  useRealtimeFeed();
  
  const {
    selectedCategories,
    setSelectedCategories,
    showFilters,
    setShowFilters,
    viewMode,
    setViewMode,
    isInitialLoad,
    feedKey,
    posts,
    isLoading,
    refreshPosts,
    clearFilters,
    handleItemOperationSuccess
  } = useFeedState();

  if (isLoading && isInitialLoad) {
    return <FeedLoadingState />;
  }

  return (
    <div className="container max-w-md mx-auto px-4 pb-20" key={feedKey}>
      <NetworkStatus onRetry={refreshPosts} />
      <FeedHeader />

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

      {/* ItemList component with enhanced prop for operation success */}
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
