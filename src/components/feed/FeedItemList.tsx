
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FeedItemCard } from "./FeedItemCard";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedErrorState } from "./FeedErrorState";
import { FeedLoadingState } from "./FeedLoadingState";
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
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [errorState, setErrorState] = useState<{ hasError: boolean, errorMessage: string }>({ 
    hasError: false, 
    errorMessage: '' 
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Log when posts change for debugging
  useEffect(() => {
    console.log('FeedItemList: Posts updated', { count: posts?.length, viewMode });
  }, [posts, viewMode]);

  // Enhanced recovery function with debouncing and complete refresh
  const handleRecoveryAction = useCallback(() => {
    try {
      setIsRefreshing(true);
      
      // Force component re-render with a new key
      setRefreshKey(Date.now());
      setErrorState({ hasError: false, errorMessage: '' });
      
      toast({
        title: "Refreshing",
        description: "Attempting to recover and refresh the feed",
      });
      
      // Clean up any potential timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Wait a bit then call onItemOperationSuccess to refresh data
      refreshTimerRef.current = setTimeout(() => {
        if (onItemOperationSuccess) {
          try {
            onItemOperationSuccess();
            console.log("Feed data refresh completed");
          } catch (err) {
            console.error("Error during recovery refresh:", err);
            // If the callback fails, we'll still try to recover UI
            setRefreshKey(Date.now() + 1);
          } finally {
            setIsRefreshing(false);
            refreshTimerRef.current = null;
          }
        } else {
          setIsRefreshing(false);
        }
      }, 800); // Longer delay for more complete refresh
    } catch (err) {
      console.error("Error during recovery action:", err);
      toast({
        title: "Recovery failed",
        description: "Please try refreshing the page manually",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  }, [onItemOperationSuccess, toast]);

  // Enhanced handler for item operations with operation type
  const handleItemSuccess = useCallback((itemId?: string | number, operationType?: OperationType) => {
    try {
      console.log(`Item ${operationType || 'operation'} success callback triggered for item ${itemId}`);
      
      // Reset any error state
      if (errorState.hasError) {
        setErrorState({ hasError: false, errorMessage: '' });
      }
      
      // Force a re-render first to clear any stale UI
      setRefreshKey(Date.now());
      
      // Clean up any potential timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Pass the operation details to the parent component for optimistic updates
      if (onItemOperationSuccess) {
        try {
          onItemOperationSuccess(itemId, operationType);
        } catch (err) {
          console.error("Error in operation success handler:", err);
          setErrorState({
            hasError: true,
            errorMessage: "Error updating feed. Please try refreshing."
          });
        }
      }
    } catch (err) {
      console.error("Error in handleItemSuccess:", err);
      setErrorState({
        hasError: true,
        errorMessage: "Error updating feed. Please try refreshing."
      });
    }
  }, [onItemOperationSuccess, errorState]);

  if (isLoading || isRefreshing) {
    return <FeedLoadingState isRefreshing={isRefreshing} />;
  }

  if (errorState.hasError) {
    return (
      <FeedErrorState 
        errorMessage={errorState.errorMessage}
        onRetry={handleRecoveryAction}
      />
    );
  }

  return (
    <div className="space-y-4" key={refreshKey}>
      {posts?.map((post) => (
        <FeedItemCard
          key={post.id}
          post={post}
          onItemOperationSuccess={handleItemSuccess}
        />
      ))}
      
      {posts?.length === 0 && (
        <FeedEmptyState
          viewMode={viewMode}
          selectedCategories={selectedCategories}
          clearFilters={clearFilters}
        />
      )}
    </div>
  );
}
