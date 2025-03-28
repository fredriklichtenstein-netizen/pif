
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
  const { isLiked, likesCount, handleLike, fetchLikers, loading: likesLoading } = useLikes(id, userId);
  const { showInterest, interestsCount, handleShowInterest, fetchInterestedUsers, loading: interestsLoading } = useInterests(id, userId);
  const { isBookmarked, handleBookmark, loading: bookmarksLoading } = useBookmarks(id, userId);

  // Combine loading states
  useEffect(() => {
    const isStillLoading = likesLoading || interestsLoading || bookmarksLoading;
    setLoading(isStillLoading);
  }, [likesLoading, interestsLoading, bookmarksLoading]);

  return {
    // States
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    loading,
    
    // Actions
    handleShowInterest,
    handleLike,
    handleBookmark,
    fetchLikers,
    fetchInterestedUsers,
  };
};

// Re-export the User type for consumers of this hook
export type { User };
