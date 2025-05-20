
import { useState, useCallback } from 'react';
import { useToast } from "@/hooks/use-toast";

interface UseFeedViewModeProps {
  user: any;
  loadSavedPosts: () => Promise<void>;
  loadMyPosts: () => Promise<void>;
  loadArchivedPosts: () => Promise<void>;
  loadInterestedPosts: () => Promise<void>;
  refreshPosts: () => Promise<void>;
}

export const useFeedViewMode = ({
  user,
  loadSavedPosts,
  loadMyPosts,
  loadArchivedPosts,
  loadInterestedPosts,
  refreshPosts
}: UseFeedViewModeProps) => {
  const [viewMode, setViewMode] = useState("all");
  const { toast } = useToast();

  // Memoized function to load posts based on view mode
  const loadPostsBasedOnViewMode = useCallback(async (mode: string) => {
    if (!user && mode !== "all") {
      toast({
        title: "Authentication required",
        description: "Please sign in to use this filter",
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
  }, [user, loadSavedPosts, loadMyPosts, loadArchivedPosts, loadInterestedPosts, refreshPosts, toast]);

  return {
    viewMode,
    setViewMode,
    loadPostsBasedOnViewMode
  };
};
