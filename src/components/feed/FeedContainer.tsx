
import { useState, useEffect, useCallback, useRef } from "react";
import { useFeedPosts } from "@/hooks/useFeedPosts";
import { Loader2 } from "lucide-react";
import { FeedFilters } from "./FeedFilters";
import { FeedItemList } from "./FeedItemList";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useSearchParams } from "react-router-dom";
import { useOptimisticFeedUpdates } from "@/hooks/feed/useOptimisticFeedUpdates";
import { useTranslation } from 'react-i18next';
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

export function FeedContainer() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState("all");
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [feedKey, setFeedKey] = useState(Date.now());
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const forceRefreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();
  
  // Get translated categories
  const CATEGORIES = [
    t('categories.furniture'),
    t('categories.electronics'), 
    t('categories.clothing'),
    t('categories.kitchen'),
    t('categories.books'),
    t('categories.toys'),
    t('categories.garden'),
    t('categories.sports'),
    t('categories.other')
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

  // New optimistic UI update hook
  const {
    recordOperation,
    applyOptimisticUpdates
  } = useOptimisticFeedUpdates();

  // Apply optimistic updates to posts
  const posts = applyOptimisticUpdates(rawPosts);

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
    console.log("Forcing complete feed refresh");
    
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
      console.log('Executing debounced feed refresh');
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
        console.log('Initial feed load complete');
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
      console.log("Time parameter detected, forcing refresh");
      forceCompleteRefresh();
    }
  }, [timeParam, isInitialLoad, forceCompleteRefresh]);

  // Enhanced handler for successful item operations (delete, archive, restore)
  const handleItemOperationSuccess = useCallback((itemId?: string | number, operationType?: OperationType) => {
    console.log('Item operation success detected:', operationType, itemId);
    
    // Apply optimistic UI update if we have item ID and operation type
    if (itemId && operationType) {
      recordOperation(itemId, operationType);
      
      // Show toast notification
      const messages = {
        delete: "Item has been permanently deleted",
        archive: "Item has been archived and can be restored later",
        restore: "Item has been restored"
      };
      
      toast({
        title: `Success! ${operationType === 'archive' ? 'Archived' : operationType === 'delete' ? 'Deleted' : 'Restored'}`,
        description: messages[operationType],
      });
    }
    
    // Still do a background refresh after a delay for data consistency
    debouncedRefresh(1500);
  }, [debouncedRefresh, recordOperation, toast]);

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

  if (isLoading && isInitialLoad) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div key={feedKey}>
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
      />
    </div>
  );
}
