
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  const [hasNewData, setHasNewData] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState<any[]>([]);
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

  // Apply optimistic updates to posts - memoized to prevent unnecessary re-renders
  const posts = useMemo(() => applyOptimisticUpdates(rawPosts), [rawPosts, applyOptimisticUpdates]);

  // Setup view mode logic
  const { viewMode, setViewMode, loadPostsBasedOnViewMode } = useFeedViewMode({
    user,
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts,
    refreshPosts
  });

  // Setup refresh logic with significantly increased delay times
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
  const minRefreshInterval = 15000; // Increased from 5 seconds to 15 seconds minimum between refreshes

  // Apply pending updates that were deferred
  const applyPendingUpdates = useCallback(() => {
    if (pendingUpdates.length > 0) {
      console.log("Applying pending updates", pendingUpdates.length);
      refreshPosts();
      setPendingUpdates([]);
      setHasNewData(false);
      lastRefreshTimeRef.current = Date.now();
    }
  }, [pendingUpdates, refreshPosts]);

  // Store updates instead of immediately applying them
  const storePendingUpdate = useCallback((update: any) => {
    setPendingUpdates(prev => [...prev, update]);
    setHasNewData(true);
  }, []);

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
        debouncedRefresh(2500); // Significantly increased delay (from 800ms to 2500ms)
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
    }, 1500); // Increased to 1.5 seconds
    
    return () => {
      clearTimeout(initialLoadTimer);
      cleanupRefreshTimers();
    };
  }, [refreshPosts, cleanupRefreshTimers]);

  // If there's a timestamp parameter, we mark that new data is available instead of auto-refreshing
  useEffect(() => {
    if (timeParam && !isInitialLoad) {
      const timeParamValue = parseInt(timeParam, 10);
      const now = Date.now();
      
      // Only mark as new data if the timestamp is recent (within last 5 minutes)
      if (now - timeParamValue < 5 * 60 * 1000) {
        console.log("Time parameter detected, notifying of new data");
        setHasNewData(true);
      }
    }
  }, [timeParam, isInitialLoad]);

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
    
    // Only do a background refresh after a much longer delay for data consistency
    const now = Date.now();
    if (now - lastRefreshTimeRef.current > minRefreshInterval) {
      lastRefreshTimeRef.current = now;
      debouncedRefresh(5000); // Even longer delay after operations (5 seconds)
    }
  }, [debouncedRefresh, recordOperation, toast, minRefreshInterval]);

  return {
    selectedCategories,
    setSelectedCategories,
    showFilters,
    setShowFilters,
    viewMode,
    setViewMode,
    isInitialLoad,
    posts,
    isLoading,
    error,
    refreshPosts,
    clearFilters,
    handleItemOperationSuccess,
    hasNewData,
    applyPendingUpdates,
    storePendingUpdate
  };
}
