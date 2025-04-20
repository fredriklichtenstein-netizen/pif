
import { useState, useEffect } from "react";
import { useGlobalAuth } from "../useGlobalAuth";
import { useLikes } from "./useLikes";
import { useInterests } from "./useInterests";
import { useBookmarks } from "./useBookmarks";
import type { User } from "./utils/userUtils";

/**
 * Hook that manages all item interactions: likes, interests, and bookmarks
 */
export const useItemInteractions = (id: string) => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);

  // Individual interaction hooks
  const { 
    isLiked, 
    likesCount, 
    likers, 
    handleLike, 
    fetchLikers, 
    loading: likesLoading 
  } = useLikes(id, userId);
  
  const { 
    showInterest, 
    interestsCount, 
    interestedUsers,
    handleShowInterest, 
    fetchInterestedUsers, 
    loading: interestsLoading,
    interestedUsersError 
  } = useInterests(id, userId);
  
  const { isBookmarked, handleBookmark, loading: bookmarksLoading } = useBookmarks(id, userId);

  // Combine loading states
  useEffect(() => {
    const isStillLoading = likesLoading || interestsLoading || bookmarksLoading;
    setLoading(isStillLoading);
  }, [likesLoading, interestsLoading, bookmarksLoading]);

  // Safe wrapper around handleShowInterest to handle any unexpected errors
  const safeHandleShowInterest = async () => {
    try {
      await handleShowInterest();
    } catch (error) {
      console.error("Error in handleShowInterest:", error);
      // We don't want to change loading state here because the useInterests hook manages it
    }
  };

  return {
    // States
    isLiked,
    likesCount,
    likers,
    showInterest,
    interestsCount,
    interestedUsers,
    isBookmarked,
    loading,
    interestedUsersError,
    
    // Actions
    handleShowInterest: safeHandleShowInterest,
    handleLike,
    handleBookmark,
    fetchLikers,
    fetchInterestedUsers,
  };
};

// Re-export the User type for consumers of this hook
export type { User };
