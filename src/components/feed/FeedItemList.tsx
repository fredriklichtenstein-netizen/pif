
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FeedItemCard } from "./FeedItemCard";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedErrorState } from "./FeedErrorState";
import { FeedLoadingState } from "./FeedLoadingState";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import { useSearchParams } from "react-router-dom";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
  isLoading?: boolean;
}

// Helper function to validate post data
const validatePostData = (post: any): boolean => {
  try {
    // Basic validation
    if (!post || typeof post !== 'object') {
      console.warn('Invalid post object:', post);
      return false;
    }

    // Required fields
    if (!post.id || !post.title) {
      console.warn('Missing required post fields:', { id: post.id, title: post.title });
      return false;
    }

    // Validate coordinates if present
    if (post.coordinates) {
      const { lng, lat } = post.coordinates;
      if (typeof lng !== 'number' || typeof lat !== 'number' || 
          isNaN(lng) || isNaN(lat) ||
          lng < -180 || lng > 180 || lat < -90 || lat > 90) {
        console.warn('Invalid coordinates:', post.coordinates);
        // Don't reject the post, just clear invalid coordinates
        post.coordinates = null;
      }
    }

    return true;
  } catch (error) {
    console.error('Error validating post data:', error, post);
    return false;
  }
};

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
  const [searchParams] = useSearchParams();
  const targetPostId = searchParams.get('post');

  // Validate and filter posts
  const validPosts = posts?.filter(validatePostData) || [];

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
    console.log('FeedItemList: Posts updated', { 
      count: posts?.length, 
      validCount: validPosts.length,
      viewMode 
    });
  }, [posts, validPosts.length, viewMode]);

  // Scroll to target post when available
  useEffect(() => {
    if (targetPostId && validPosts && validPosts.length > 0) {
      console.log('Attempting to scroll to post:', targetPostId);
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(`post-${targetPostId}`);
        if (targetElement) {
          console.log('Found target element, scrolling to post:', targetPostId);
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        } else {
          console.log('Target post element not found:', targetPostId);
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [targetPostId, validPosts]);

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
            setRefreshKey(Date.now() + 1);
          } finally {
            setIsRefreshing(false);
            refreshTimerRef.current = null;
          }
        } else {
          setIsRefreshing(false);
        }
      }, 800);
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
    <FeedErrorBoundary onReset={handleRecoveryAction}>
      <div className="space-y-4" key={refreshKey}>
        {validPosts?.map((post) => (
          <div key={post.id} id={`post-${post.id}`}>
            <FeedItemCard
              post={post}
              onItemOperationSuccess={handleItemSuccess}
            />
          </div>
        ))}
        
        {validPosts?.length === 0 && (
          <FeedEmptyState
            viewMode={viewMode}
            selectedCategories={selectedCategories}
            clearFilters={clearFilters}
          />
        )}
      </div>
    </FeedErrorBoundary>
  );
}
