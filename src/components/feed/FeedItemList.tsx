
import { useEffect, useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { FeedItemCard } from "./FeedItemCard";
import { FeedEmptyState } from "./FeedEmptyState";
import { FeedErrorState } from "./FeedErrorState";
import { FeedLoadingState } from "./FeedLoadingState";
import { FeedErrorBoundary } from "./FeedErrorBoundary";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";
import { useTranslation } from "react-i18next";
import { LazyMount } from "./LazyMount";

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
  /** IDs of items animating back in (fade-in applied briefly after undo). */
  restoringIds?: Set<string>;
  /** Deep-linked post (/feed?post=<id>): scrolled into view and briefly highlighted once rendered. */
  scrollToPostId?: string | null;
}

// Helper function to validate post data
// Any of these means the user took over scrolling: stop anchoring the
// deep-linked post.
const USER_SCROLL_EVENTS = ["wheel", "touchstart", "keydown", "mousedown"] as const;

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
  restoringIds,
  scrollToPostId,
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
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const scrolledForRef = useRef<string | null>(null);
  const scrollTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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

  // Scroll to the deep-linked post once its card is in the DOM, and keep it
  // centred while the page settles: cards above it mount lazily (their real
  // height differs from LazyMount's placeholder) and their images load
  // later, so a single scroll -- or a smooth one that mounts cards on the
  // way -- left a neighbouring post on screen. Re-centre instantly on every
  // layout change for ANCHOR_MS, until the user scrolls or touches.
  const anchorCleanupRef = useRef<(() => void) | null>(null);
  useEffect(() => {
    if (!scrollToPostId || scrolledForRef.current === scrollToPostId) return;
    const el = document.getElementById(`post-${scrollToPostId}`);
    if (!el) return;
    scrolledForRef.current = scrollToPostId;
    anchorCleanupRef.current?.();

    const ANCHOR_MS = 5000;
    const center = () =>
      document.getElementById(`post-${scrollToPostId}`)?.scrollIntoView({ behavior: 'auto', block: 'center' });
    center();
    setHighlightedId(scrollToPostId);

    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(center);
    });
    observer.observe(document.body);
    const stop = () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.clearTimeout(timer);
      USER_SCROLL_EVENTS.forEach((type) => window.removeEventListener(type, stop));
      anchorCleanupRef.current = null;
    };
    const timer = window.setTimeout(stop, ANCHOR_MS);
    USER_SCROLL_EVENTS.forEach((type) => window.addEventListener(type, stop, { passive: true }));
    anchorCleanupRef.current = stop;

    scrollTimersRef.current.push(setTimeout(() => setHighlightedId(null), 4000));
  }, [scrollToPostId, validPosts.length]);

  useEffect(() => () => {
    scrollTimersRef.current.forEach(clearTimeout);
    anchorCleanupRef.current?.();
  }, []);

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
        {validPosts?.map((post, index) => {
          const isFading = fadingIds?.has(String(post.id));
          const isRestoring = restoringIds?.has(String(post.id));
          const isArchived = post?.status === 'archived' || !!post?.archived_at;
          const isCompleted = post?.status === 'completed';
          const isTerminal = isArchived || isCompleted;
          const animationClass = isFading
            ? 'animate-fade-out-collapse pointer-events-none'
            : isRestoring
              ? 'animate-fade-in'
              : undefined;
          // Render the first 3 cards eagerly (above-the-fold); lazy-mount
          // the rest so heavy per-card subscriptions/fetches only fire
          // as the user scrolls them into view.
          const card = (
            <FeedItemCard
              post={post}
              onItemOperationSuccess={isShowingMockData ? undefined : handleItemSuccess}
            />
          );
          return (
            <div
              key={post.id}
              id={`post-${post.id}`}
              className={[
                animationClass,
                isTerminal ? 'opacity-75 relative' : '',
                highlightedId === String(post.id)
                  ? 'rounded-lg ring-2 ring-primary ring-offset-2 transition-shadow'
                  : '',
              ].filter(Boolean).join(' ') || undefined}
              aria-hidden={isFading || undefined}
            >
              {isCompleted && !isArchived && (
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-primary/90 text-primary-foreground text-xs font-medium shadow">
                  {t('feed.completed', 'Genomförd')}
                </div>
              )}
              {isArchived && (
                <div className="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs font-medium shadow">
                  {t('feed.archived_badge', 'Arkiverad')}
                </div>
              )}
              {index < 3 || String(post.id) === scrollToPostId ? card : <LazyMount>{card}</LazyMount>}
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
