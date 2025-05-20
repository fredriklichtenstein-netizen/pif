
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

  // Setup refresh logic
  const { 
    debouncedRefresh, 
    forceCompleteRefresh, 
    cleanupRefreshTimers 
  } = useFeedRefresh({
    loadPostsBasedOnViewMode,
    viewMode
  });

  // Define clearFilters function
  const clearFilters = useCallback(() => {
    setSelectedCategories([]);
  }, []);

  // Apply category filters whenever selected categories change
  useEffect(() => {
    filterByCategories(selectedCategories);
  }, [selectedCategories, filterByCategories]);

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
      cleanupRefreshTimers();
    };
  }, [refreshPosts, cleanupRefreshTimers]);

  // If there's a timestamp parameter, it's coming from a refresh - force refresh data
  useEffect(() => {
    if (timeParam && !isInitialLoad) {
      console.log("Time parameter detected, forcing refresh");
      forceCompleteRefresh(setFeedKey);
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
