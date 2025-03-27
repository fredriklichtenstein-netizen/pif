
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

  // Individual interaction hooks
  const { isLiked, likesCount, handleLike, fetchLikers } = useLikes(id, userId);
  const { showInterest, interestsCount, handleShowInterest, fetchInterestedUsers } = useInterests(id, userId);
  const { isBookmarked, handleBookmark } = useBookmarks(id, userId);

  return {
    // States
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    
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
