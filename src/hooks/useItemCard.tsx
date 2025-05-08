
import { useCallback } from "react";
import { useItemComments } from "./item/useItemComments";
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useItemUsers } from "./item/useItemUsers";
import { useItemRealtime } from "./item/useItemRealtime";

export const useItemCard = (itemId: string) => {
  const {
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    setComments,
    handleCommentToggle,
    fetchItemComments,
    setCommentsCount
  } = useItemComments(itemId);

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

  const { handleMessage, handleShare, handleReport } = useItemActions();

  const refreshData = useCallback(() => {
    fetchLikers()
      .then(() => console.log('Refreshed likes data'))
      .catch(err => console.error('Error refreshing likes:', err));
    
    fetchInterestedUsers()
      .then(() => console.log('Refreshed interests data'))
      .catch(err => console.error('Error refreshing interests:', err));
    
    if (showComments) {
      fetchItemComments();
    }
  }, [itemId, fetchLikers, fetchInterestedUsers, showComments, fetchItemComments]);

  const { 
    likers, 
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  } = useItemUsers(
    comments,
    fetchLikers,
    likesCount,
    fetchInterestedUsers,
    interestsCount
  );

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
