
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useItemRealtime } from "./item/useItemRealtime";
import { useItemCardComments } from "./item/useItemCardComments";
import { useItemCardUsers } from "./item/useItemCardUsers";
import { useItemCardRefresh } from "./item/useItemCardRefresh";

export const useItemCard = (itemId: string) => {
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
    fetchLikers,
    fetchInterestedUsers,
    loading: interactionsLoading,
    interestedUsersError
  } = useItemInteractions(itemId);

  // Action handlers
  const { handleMessage, handleShare, handleReport } = useItemActions();

  // Data refresh functionality
  const { refreshData } = useItemCardRefresh(
    fetchLikers,
    fetchInterestedUsers,
    showComments,
    fetchItemComments
  );

  // User data management
  const { 
    likers, 
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  } = useItemCardUsers(
    itemId,
    comments,
    fetchLikers,
    likesCount,
    fetchInterestedUsers,
    interestsCount
  );

  // Realtime updates
  const {
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData,
    cleanup
  } = useItemRealtime(itemId, refreshData);

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
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData,
    cleanup
  };
};
