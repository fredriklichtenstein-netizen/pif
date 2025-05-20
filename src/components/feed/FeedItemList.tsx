
import React, { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useFeedContext } from "@/context/feed"; 
import { useFeedItemOperations } from "@/hooks/feed/useFeedItemOperations";
import { FeedItem } from "./FeedItem";
import { FeedErrorState } from "./FeedErrorState";
import { FeedEmptyState } from "./FeedEmptyState";
import { getEcoEmptyStateMessage } from "./utils/sustainabilityMessages";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
  isLoading?: boolean;
}

export function FeedItemList({
  posts,
  selectedCategories,
  clearFilters,
  viewMode,
  onItemOperationSuccess,
  isLoading = false
}: FeedItemListProps) {
  const { items, setItems } = useFeedContext();
  
  const { 
    refreshKey, 
    errorState, 
    isRefreshing, 
    handleRecoveryAction, 
    handleItemSuccess, 
    cleanupTimers 
  } = useFeedItemOperations({ onItemOperationSuccess });

  // Sync posts from props to context on initial load and updates
  useEffect(() => {
    if (posts && posts.length > 0) {
      // Update the feed context with the latest posts
      setItems(posts);
    }
  }, [posts, setItems]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupTimers();
    };
  }, [cleanupTimers]);

  if (isLoading || isRefreshing) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (errorState.hasError) {
    return (
      <FeedErrorState 
        errorMessage={errorState.errorMessage} 
        onRefresh={handleRecoveryAction} 
      />
    );
  }

  // Use items from context instead of posts from props
  const displayItems = items.length > 0 ? items : posts;

  if (displayItems.length === 0) {
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
    <div className="space-y-4" key={refreshKey}>
      {displayItems.map((post) => (
        <FeedItem 
          key={post.id} 
          post={post} 
          onOperationSuccess={handleItemSuccess} 
        />
      ))}
    </div>
  );
}
