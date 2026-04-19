
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FeedItemCard } from "./FeedItemCard";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedErrorState } from "./FeedErrorState";
import { FeedLoadingState } from "./FeedLoadingState";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import { useSearchParams } from "react-router-dom";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";
import { useTranslation } from "react-i18next";

interface FeedItemListProps {
  posts: any[];
  selectedCategories: string[];
  clearFilters: () => void;
  viewMode: string;
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
  isLoading?: boolean;
  isShowingMockData?: boolean;
  /** IDs of items currently animating out (fade-out applied while still rendered). */
  fadingIds?: Set<string>;
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
  isLoading = false,
  isShowingMockData = false,
  fadingIds,
}: FeedItemListProps) {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [errorState, setErrorState] = useState<{ hasError: boolean, errorMessage: string }>({ 
    hasError: false, 
    errorMessage: '' 
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();
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
  }, [posts, validPosts.length, viewMode]);

  // Scroll to target post when available
  useEffect(() => {
    if (targetPostId && validPosts && validPosts.length > 0) {
      const timer = setTimeout(() => {
        const targetElement = document.getElementById(`post-${targetPostId}`);
        if (targetElement) {
          targetElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        } else {
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
      
      // Clean up any potential timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Wait a bit then call onItemOperationSuccess to refresh data
      refreshTimerRef.current = setTimeout(() => {
        if (onItemOperationSuccess) {
          try {
            onItemOperationSuccess();
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
        title: t('interactions.recovery_failed'),
        description: t('interactions.recovery_failed_description'),
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  }, [onItemOperationSuccess, toast]);

  // Enhanced handler for item operations with operation type
  const handleItemSuccess = useCallback((itemId?: string | number, operationType?: OperationType) => {
    try {
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
            errorMessage: t('interactions.feed_update_error')
          });
        }
      }
    } catch (err) {
      console.error("Error in handleItemSuccess:", err);
      setErrorState({
        hasError: true,
        errorMessage: t('interactions.feed_update_error')
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
        {validPosts?.map((post) => {
          const isFading = fadingIds?.has(String(post.id));
          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={isFading ? 'animate-fade-out-collapse pointer-events-none' : undefined}
              aria-hidden={isFading || undefined}
            >
              <FeedItemCard
                post={post}
                onItemOperationSuccess={isShowingMockData ? undefined : handleItemSuccess}
              />
            </div>
          );
        })}
        
        {validPosts?.length === 0 && !isShowingMockData && (
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
