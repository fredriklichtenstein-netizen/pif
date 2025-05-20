
import React from "react";
import { VirtualizedFeedList } from "./VirtualizedFeedList";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
  isLoading?: boolean;
}

// This component is now a wrapper around VirtualizedFeedList for backward compatibility
export function FeedItemList({
  posts,
  selectedCategories,
  clearFilters,
  viewMode,
  onItemOperationSuccess,
  isLoading = false
}: FeedItemListProps) {
  return (
    <VirtualizedFeedList
      posts={posts}
      selectedCategories={selectedCategories}
      clearFilters={clearFilters}
      viewMode={viewMode}
      isLoading={isLoading}
      onItemOperationSuccess={onItemOperationSuccess}
    />
  );
}
