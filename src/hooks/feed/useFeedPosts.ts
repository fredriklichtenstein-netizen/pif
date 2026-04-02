
import { useState, useEffect, useCallback, useRef } from "react";
import { useFetchPosts } from "./useFetchPosts";
import { useUserPosts } from "./useUserPosts";
import { usePostsFilter } from "./usePostsFilter";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export interface FeedPostsOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

export function useFeedPosts(options: FeedPostsOptions = {}) {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const { user } = useGlobalAuth();
  const [viewMode, setViewMode] = useState("all");
  const refreshInProgressRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Import core hooks
  const { 
    posts: fetchedPosts, 
    isLoading: isFetchLoading, 
    error: fetchError, 
    fetchPosts, 
    cleanup: cleanupFetchPosts 
  } = useFetchPosts({ includeArchived: options.includeArchived });
    
  const { 
    posts: userPosts, 
    isLoading: isUserPostsLoading, 
    error: userPostsError,
    loadSavedPosts,
    loadMyPosts, 
    loadInterestedPosts,
    loadArchivedPosts,
    cleanup: cleanupUserPosts
  } = useUserPosts({ 
    includeArchived: options.includeArchived,
    onlyArchived: options.onlyArchived
  });
  
  // Set up filters with the current posts
  const { filteredPosts, filterByCategories } = usePostsFilter(allPosts);

  // Update allPosts when fetchedPosts changes (in "all" mode)
  useEffect(() => {
    if (viewMode === "all") {
      setAllPosts(fetchedPosts);
    }
  }, [fetchedPosts, viewMode]);

  // Update allPosts when userPosts changes (in user-specific modes)
  useEffect(() => {
    if (viewMode !== "all" && userPosts.length >= 0) {
      setAllPosts(userPosts);
    }
  }, [userPosts, viewMode]);

  // Debounced refresh function to prevent multiple rapid refreshes
  const debouncedLoadPosts = useCallback((mode: string, delay = 300) => {
    if (refreshInProgressRef.current) {
      return;
    }
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      refreshInProgressRef.current = true;
      
      const loadAction = async () => {
        switch (mode) {
          case "saved":
            await loadSavedPosts(user);
            break;
          case "myPifs":
            await loadMyPosts(user);
            break;
          case "archived":
            await loadArchivedPosts(user);
            break;
          case "interested":
            await loadInterestedPosts(user);
            break;
          default:
            await fetchPosts();
        }
        
        refreshInProgressRef.current = false;
      };
      
      loadAction().catch(err => {
        console.error('Error in debouncedLoadPosts:', err);
        refreshInProgressRef.current = false;
      });
      
      debounceTimerRef.current = null;
    }, delay);
    
  }, [fetchPosts, loadSavedPosts, loadMyPosts, loadArchivedPosts, loadInterestedPosts, user]);

  // Load posts based on viewMode
  const loadPostsBasedOnViewMode = useCallback(async (mode: string) => {
    setViewMode(mode);
    debouncedLoadPosts(mode, 300);
  }, [debouncedLoadPosts]);

  // Cleanup function to abort any pending requests on unmount
  useEffect(() => {
    return () => {
      cleanupFetchPosts();
      cleanupUserPosts();
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [cleanupFetchPosts, cleanupUserPosts]);

  // Initial posts fetch
  useEffect(() => {
    debouncedLoadPosts("all", 500);
  }, [debouncedLoadPosts]);

  return {
    posts: filteredPosts,
    allPosts,
    isLoading: isFetchLoading || isUserPostsLoading,
    error: fetchError || userPostsError,
    refreshPosts: fetchPosts,
    filterByCategories,
    loadSavedPosts: () => loadPostsBasedOnViewMode("saved"),
    loadMyPosts: () => loadPostsBasedOnViewMode("myPifs"),
    loadArchivedPosts: () => loadPostsBasedOnViewMode("archived"),
    loadInterestedPosts: () => loadPostsBasedOnViewMode("interested"),
    loadAll: () => loadPostsBasedOnViewMode("all"),
    currentViewMode: viewMode
  };
}
