
import { useCallback } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useItemCardComments } from "./item/useItemCardComments";
import { useItemCardUsers } from "./item/useItemCardUsers";
import { useItemCardRefresh } from "./item/useItemCardRefresh";
import { useInteractionCountsRealtime } from "./item/realtime/useInteractionCountsRealtime";

export const useItemCard = (itemId: string) => {
  const cleanup = useCallback(() => {}, []);

  // Get comments functionality
  const {
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    setComments,
    handleCommentToggle,
    fetchItemComments,
    setCommentsCount,
    refreshComments
  } = useItemCardComments(itemId);

  // Get interactions functionality
  const {
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    handleLike,
    handleShowInterest,
    handleBookmark,
    fetchInterestedUsers,
    likers,
    loading: interactionsLoading,
    interestedUsersError
  } = useItemInteractions(itemId);

  // Action handlers
  const { handleMessage, handleShare, handleReport } = useItemActions();

  // Data refresh functionality
  const { refreshData } = useItemCardRefresh(
    fetchInterestedUsers,
    showComments,
    fetchItemComments
  );

  // User data management
  const { 
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  } = useItemCardUsers(
    comments,
    fetchInterestedUsers,
    interestsCount
  );

  // Feed-level realtime handles shared interaction counts. Cards must not
  // open their own channels, otherwise a refreshed feed creates one channel
  // per card and can exhaust Supabase Realtime/WebSocket resources.
  const refreshItemData = refreshData;

  return {
    // Comments
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    // Interactions
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    interactionsLoading,
    // Users
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    interestedError,
    // Actions
    handleLike,
    handleCommentToggle,
    handleShowInterest,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    // State updates
    setComments,
    getInterestedUsers,
    // Realtime
    isRealtimeSubscribed: false,
    realtimeError: null,
    refreshItemData,
    cleanup
  };
};
