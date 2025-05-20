
import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useToast } from "@/hooks/use-toast";
import { useFeedPosts } from "@/hooks/feed/useFeedPosts";
import { useOptimisticFeedUpdates, type OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";
import { useFeedViewMode } from "@/hooks/feed/useFeedViewMode";
import { useFeedRefresh } from "@/hooks/feed/useFeedRefresh";

export function useFeedState() {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [feedKey, setFeedKey] = useState(Date.now());
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  
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

  // Setup view mode logic
  const { viewMode, setViewMode, loadPostsBasedOnViewMode } = useFeedViewMode({
    user,
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts,
    refreshPosts
  });

  // Setup refresh logic with reduced frequency
  const { 
    debouncedRefresh, 
    forceCompleteRefresh, 
    cleanupRefreshTimers 
  } = useFeedRefresh({
    loadPostsBasedOnViewMode,
    viewMode
  });

  // Track the last refresh time to limit frequency
  const lastRefreshTimeRef = useRef<number>(0);
  const minRefreshInterval = 5000; // 5 seconds minimum between refreshes

  // Define clearFilters function
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // Apply category filters whenever selected categories change
  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);

  // Load posts whenever view mode changes or user auth state changes
  // Added throttling to prevent too frequent refreshes
  useEffect(() => {
    if (!isInitialLoad) {  // Skip immediate refresh on first render
      const now = Date.now();
      if (now - lastRefreshTimeRef.current > minRefreshInterval) {
        lastRefreshTimeRef.current = now;
        debouncedRefresh(800); // Use a longer delay
      } else {
        console.log("Skipping refresh, too soon since last refresh");
      }
    }
  }, [viewMode, user, debouncedRefresh, isInitialLoad]);

  // Initial refresh on component mount with a longer delay to prevent race conditions
  useEffect(() => {
    const initialLoadTimer = setTimeout(() => {
      refreshPosts().then(() => {
        setIsInitialLoad(false);  // Mark initial load as complete after first refresh
        lastRefreshTimeRef.current = Date.now();
        console.log('Initial feed load complete');
      });
    }, 800); // Increased from 500ms
    
    return () => {
      clearTimeout(initialLoadTimer);
      cleanupRefreshTimers();
    };
  }, [refreshPosts, cleanupRefreshTimers]);

  // If there's a timestamp parameter, it's coming from a refresh - force refresh data
  // But do this less frequently
  useEffect(() => {
    if (timeParam && !isInitialLoad) {
      const now = Date.now();
      const timeParamValue = parseInt(timeParam, 10);
      
      // Only refresh if the timestamp is recent and we haven't refreshed too recently
      if (now - timeParamValue < 60000 && now - lastRefreshTimeRef.current > minRefreshInterval) {
        console.log("Time parameter detected, forcing refresh");
        lastRefreshTimeRef.current = now;
        forceCompleteRefresh(setFeedKey);
      } else {
        console.log("Skipping time-based refresh, too soon since last refresh");
      }
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
    
    // Still do a background refresh after a longer delay for data consistency
    const now = Date.now();
    if (now - lastRefreshTimeRef.current > minRefreshInterval) {
      lastRefreshTimeRef.current = now;
      debouncedRefresh(2500); // Even longer delay after operations
    }
  }, [debouncedRefresh, recordOperation, toast]);

  return {
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
    error,
    refreshPosts,
    clearFilters,
    handleItemOperationSuccess
  };
}
