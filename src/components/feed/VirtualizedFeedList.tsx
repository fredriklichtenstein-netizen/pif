
import { memo, useRef, useState, useEffect, useMemo } from "react";
import { VirtualizedList } from "@/components/ui/virtualized-list";
import { FeedItem } from "@/context/feed/types";
import { FeedItem as FeedItemComponent } from "./FeedItem";
import { Loader2 } from "lucide-react";
import { FeedErrorState } from "./FeedErrorState";
import { FeedEmptyState } from "./FeedEmptyState";
import { getEcoEmptyStateMessage } from "./utils/sustainabilityMessages";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface VirtualizedFeedListProps {
  posts: FeedItem[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  isLoading?: boolean;
  errorState?: { hasError: boolean; errorMessage?: string };
  onRetry?: () => void;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
}

export const VirtualizedFeedList = memo(function VirtualizedFeedList({
  posts,
  selectedCategories,
  clearFilters,
  viewMode,
  isLoading = false,
  errorState = { hasError: false },
  onRetry,
  onItemOperationSuccess
}: VirtualizedFeedListProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState(window.innerHeight - 200);
  
  // Calculate container height based on window size
  useEffect(() => {
    const calculateHeight = () => {
      // Subtract header, navbar and some padding
      setContainerHeight(window.innerHeight - 200);
    };
    
    calculateHeight();
    window.addEventListener('resize', calculateHeight);
    
    return () => {
      window.addEventListener('resize', calculateHeight);
    };
  }, []);

  // Filter out already deleted posts
  const filteredPosts = useMemo(() => {
    return posts.filter(post => !post.__deleted);
  }, [posts]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (errorState?.hasError) {
    return (
      <FeedErrorState 
        errorMessage={errorState.errorMessage} 
        onRefresh={onRetry}
      />
    );
  }

  if (filteredPosts.length === 0) {
    // Get the single category if only one is selected
    const singleCategory = selectedCategories.length === 1 ? selectedCategories[0] : undefined;
    
    return (
      <FeedEmptyState 
        message={getEcoEmptyStateMessage(viewMode, selectedCategories.length > 0)} 
        showClearFiltersButton={selectedCategories.length > 0}
        onClearFilters={clearFilters}
        category={singleCategory}
      />
    );
  }

  return (
    <div ref={containerRef} className="pb-16">
      <VirtualizedList
        items={filteredPosts}
        height={containerHeight}
        itemHeight={400} // Estimated average height for feed items
        overscan={3} // Load 3 items before and after viewport
        renderItem={(post) => (
          <div className="py-2">
            <FeedItemComponent 
              post={post} 
              onOperationSuccess={onItemOperationSuccess} 
            />
          </div>
        )}
        className="space-y-0"
      />
    </div>
  );
});
