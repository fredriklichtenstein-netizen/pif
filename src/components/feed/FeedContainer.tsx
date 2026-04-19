
import { useState, useEffect, useCallback, useRef } from "react";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Loader2 } from "lucide-react";
import { FeedFilters } from "./FeedFilters";
import { FeedItemList } from "./FeedItemList";
import { OfflineBanner } from "./OfflineBanner";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useOptimisticFeedUpdates } from "@/hooks/feed/useOptimisticFeedUpdates";
import { useOfflineAwareFeed } from "@/hooks/useOfflineAwareFeed";
import { useTranslation } from 'react-i18next';
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export function FeedContainer() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [feedKey, setFeedKey] = useState(Date.now());
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  
  // Timeout to show mock data if loading takes too long (3 seconds)
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);
  
  // Categories sorted alphabetically by Swedish display name
  const CATEGORIES = [
    'kids', 'mixed', 'books', 'bicycle', 'electronics', 'vehicles',
    'home_garden', 'pets', 'household', 'health', 'art', 'clothing',
    'kitchen', 'toys', 'food', 'music', 'furniture', 'sports',
    'garden', 'tools', 'other'
  ];
  
  // Get post ID from URL if present
  const postIdParam = searchParams.get('post');
  const timeParam = searchParams.get('t');
  
  const { 
    posts: rawPosts, 
    isLoading, 
    error, 
    refreshPosts, 
    filterByCategories, 
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts
  } = useFeedPosts();

  // Offline awareness
  const {
    shouldShowOfflineMode,
    mockPosts,
    markConnectionError
  } = useOfflineAwareFeed();

  // New optimistic UI update hook
  const {
    recordOperation,
    applyOptimisticUpdates
  } = useOptimisticFeedUpdates();

  // Apply optimistic updates to posts - use mock data when offline/error
  const realPosts = applyOptimisticUpdates(rawPosts);
  
  // Show mock data if: offline mode OR (error AND no real posts) OR loading timeout with no data
  const hasError = !!error;
  const hasNoData = realPosts.length === 0;
  const showMockFallback = shouldShowOfflineMode || (hasError && hasNoData) || (loadingTimeout && hasNoData && isLoading);
  
  const posts = showMockFallback ? mockPosts : realPosts;
  const isShowingMockData = showMockFallback;

  // Mark connection error if we have an error from the feed
  useEffect(() => {
    if (error) {
      markConnectionError();
    }
  }, [error, markConnectionError]);

  // Function to force a complete refresh of the feed
  const forceCompleteRefresh = useCallback(() => {
    // Clear any ongoing timers
    if (forceRefreshTimeoutRef.current) {
      clearTimeout(forceRefreshTimeoutRef.current);
    }
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    // Log the refresh
    // Update the key to force a component remount
    setFeedKey(Date.now());
    
    // Force refresh after a delay
    forceRefreshTimeoutRef.current = setTimeout(() => {
      loadPostsBasedOnViewMode(viewMode);
      forceRefreshTimeoutRef.current = null;
    }, 300);
  }, [viewMode]);

  // Define clearFilters function
  const clearFilters = () => {
    setSelectedCategories([]);
  };

  // Apply category filters whenever selected categories change
  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedRefresh = useCallback((delay = 300) => {
    if (refreshTimeoutRef.current !== null) {
      clearTimeout(refreshTimeoutRef.current);
    }
    
    refreshTimeoutRef.current = setTimeout(() => {
      loadPostsBasedOnViewMode(viewMode);
      refreshTimeoutRef.current = null;
    }, delay);
  }, [viewMode]);

  // Memoized function to load posts based on view mode
  const loadPostsBasedOnViewMode = useCallback(async (mode: string) => {
    if (!user && mode !== "all") {
      toast({
        title: t('nav.auth_required'),
        description: t('nav.sign_in_required'),
        variant: "destructive"
      });
      setViewMode("all");
      return;
    }
    
    switch (mode) {
      case "saved":
        await loadSavedPosts();
        break;
      case "myPifs":
        await loadMyPosts();
        break;
      case "archived":
        await loadArchivedPosts();
        break;
      case "interested":
        await loadInterestedPosts();
        break;
      default:
        await refreshPosts();
    }
  }, [user, loadSavedPosts, loadMyPosts, loadArchivedPosts, loadInterestedPosts, refreshPosts, toast, t]);

  // Load posts whenever view mode changes or user auth state changes
  useEffect(() => {
    if (!isInitialLoad) {  // Skip immediate refresh on first render
      debouncedRefresh(300);
    }
  }, [viewMode, user, debouncedRefresh, isInitialLoad]);

  // Initial refresh on component mount with a longer delay to prevent race conditions
  useEffect(() => {
    const initialLoadTimer = setTimeout(() => {
      refreshPosts().then(() => {
        setIsInitialLoad(false);  // Mark initial load as complete after first refresh
      });
    }, 500);
    
    return () => {
      clearTimeout(initialLoadTimer);
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (forceRefreshTimeoutRef.current !== null) {
        clearTimeout(forceRefreshTimeoutRef.current);
      }
    };
  }, [refreshPosts]);

  // If there's a timestamp parameter, it's coming from a refresh - force refresh data
  useEffect(() => {
    if (timeParam && !isInitialLoad) {
      forceCompleteRefresh();
    }
  }, [timeParam, isInitialLoad, forceCompleteRefresh]);

  // Enhanced handler for successful item operations (delete, archive, restore)
  const handleItemOperationSuccess = useCallback((itemId?: string | number, operationType?: OperationType) => {
    // Apply optimistic UI update if we have item ID and operation type
    if (itemId && operationType) {
      recordOperation(itemId, operationType);
      // Toast intentionally removed — UI reflects the action (item disappears/restored)
    }
    
    // Still do a background refresh after a delay for data consistency
    debouncedRefresh(1500);
  }, [debouncedRefresh, recordOperation]);

  // Cleanup function to prevent memory leaks
  useEffect(() => {
    return () => {
      if (refreshTimeoutRef.current !== null) {
        clearTimeout(refreshTimeoutRef.current);
      }
      if (forceRefreshTimeoutRef.current !== null) {
        clearTimeout(forceRefreshTimeoutRef.current);
      }
    };
  }, []);

  // Only show loading spinner on initial load if we're not showing mock data and no error
  if (isLoading && isInitialLoad && !isShowingMockData && !error) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div key={feedKey}>
      {/* Offline banner */}
      {isShowingMockData && <OfflineBanner showMockData={true} />}
      
      {/* Filters component */}
      <FeedFilters
        categories={CATEGORIES}
        selectedCategories={selectedCategories}
        setSelectedCategories={setSelectedCategories}
        allSelected={selectedCategories.length === CATEGORIES.length}
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
        isShowingMockData={isShowingMockData}
      />
    </div>
  );
}
