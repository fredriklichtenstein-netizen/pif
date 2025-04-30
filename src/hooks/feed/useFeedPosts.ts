
import { useState, useEffect, useCallback } from "react";
import { useFetchPosts } from "./useFetchPosts";
import { useUserPosts } from "./useUserPosts";
import { usePostsFilter } from "./usePostsFilter";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

export function useFeedPosts() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const { user } = useGlobalAuth();
  const [viewMode, setViewMode] = useState("all");
  
  // Import core hooks
  const { posts: fetchedPosts, isLoading: isFetchLoading, error: fetchError, fetchPosts } = useFetchPosts();
  const { 
    posts: userPosts, 
    isLoading: isUserPostsLoading, 
    error: userPostsError,
    loadSavedPosts,
    loadMyPosts, 
    loadInterestedPosts 
  } = useUserPosts();
  
  // Set up filters with the current posts
  const { filteredPosts, filterByCategories } = usePostsFilter(allPosts);

  // Update allPosts when fetchedPosts changes (in "all" mode)
  useEffect(() => {
    if (viewMode === "all" && fetchedPosts.length > 0) {
      setAllPosts(fetchedPosts);
    }
  }, [fetchedPosts, viewMode]);

  // Update allPosts when userPosts changes (in user-specific modes)
  useEffect(() => {
    if (viewMode !== "all" && userPosts.length >= 0) {
      setAllPosts(userPosts);
    }
  }, [userPosts, viewMode]);

  // Load posts based on viewMode
  const loadPostsBasedOnViewMode = useCallback(async (mode: string) => {
    setViewMode(mode);
    
    switch (mode) {
      case "saved":
        await loadSavedPosts(user);
        break;
      case "myPifs":
        await loadMyPosts(user);
        break;
      case "interested":
        await loadInterestedPosts(user);
        break;
      default:
        await fetchPosts();
    }
  }, [fetchPosts, loadSavedPosts, loadMyPosts, loadInterestedPosts, user]);

  // Initial posts fetch
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts: filteredPosts,
    allPosts,
    isLoading: isFetchLoading || isUserPostsLoading,
    error: fetchError || userPostsError,
    refreshPosts: fetchPosts,
    filterByCategories,
    loadSavedPosts: () => loadPostsBasedOnViewMode("saved"),
    loadMyPosts: () => loadPostsBasedOnViewMode("myPifs"),
    loadInterestedPosts: () => loadPostsBasedOnViewMode("interested"),
    loadAll: () => loadPostsBasedOnViewMode("all"),
    currentViewMode: viewMode
  };
}
