import { useState, useEffect, useCallback } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useComments } from "./item/useComments";
import { useItemActions } from "./item/useItemActions";
import { useItemUsers } from "./item/useItemUsers";
import { Comment } from "@/types/comment";
import { useItemRealtimeUpdates } from "./item/useItemRealtimeUpdates";

export const useItemCard = (itemId: string) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<Error | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [interactionsLoading, setInteractionsLoading] = useState(true);
  const [isRealtimeSubscribed, setIsRealtimeSubscribed] = useState(false);

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
    loading: interactionsHookLoading,
    interestedUsersError
  } = useItemInteractions(itemId);

  const { handleMessage, handleShare, handleReport } = useItemActions();

  const {
    fetchComments,
    fetchCommentsCount,
    fetchCommenters,
    isLoading: commentsHookLoading,
    error: commentsHookError
  } = useComments(itemId);

  useEffect(() => {
    setCommentsLoading(commentsHookLoading);
    if (commentsHookError) setCommentsError(commentsHookError);
  }, [commentsHookLoading, commentsHookError]);

  useEffect(() => {
    setInteractionsLoading(interactionsHookLoading);
  }, [interactionsHookLoading]);

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

  useEffect(() => {
    const getCommentsCount = async () => {
      try {
        const count = await fetchCommentsCount(itemId);
        console.log(`Item ${itemId} has ${count} comments`);
        setCommentsCount(count);
      } catch (error) {
        console.error("Error fetching comments count:", error);
      }
    };
    
    if (itemId) {
      getCommentsCount();
    }
  }, [itemId, fetchCommentsCount, comments.length]);

  const fetchItemComments = useCallback(async () => {
    if (!itemId) return;
    
    console.log(`Fetching comments for item ${itemId}`);
    setCommentsLoading(true);
    setCommentsError(null);
    
    try {
      const fetchedComments = await fetchComments();
      console.log(`Fetched ${fetchedComments.length} comments for item ${itemId}`);
      setComments(fetchedComments);
      setCommentsFetched(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentsError(error instanceof Error ? error : new Error('Unknown error fetching comments'));
    } finally {
      setCommentsLoading(false);
    }
  }, [itemId, fetchComments]);

  const handleCommentToggle = useCallback(() => {
    console.log(`Toggling comments for item ${itemId}`);
    setShowComments(!showComments);
    
    if (!showComments) {
      fetchItemComments();
    }
  }, [showComments, fetchItemComments, itemId]);

  const refreshComments = useCallback(() => {
    setCommentsFetched(false);
    fetchItemComments();
  }, [fetchItemComments]);

  const refreshItemData = useCallback(() => {
    fetchLikers()
      .then(() => console.log('Refreshed likes data'))
      .catch(err => console.error('Error refreshing likes:', err));
    
    fetchInterestedUsers()
      .then(() => console.log('Refreshed interests data'))
      .catch(err => console.error('Error refreshing interests:', err));
    
    fetchCommentsCount(itemId)
      .then(count => {
        console.log(`Item ${itemId} has ${count} comments`);
        setCommentsCount(count);
      })
      .catch(err => console.error('Error refreshing comments count:', err));
    
    if (showComments) {
      fetchItemComments();
    }
  }, [itemId, fetchLikers, fetchInterestedUsers, fetchCommentsCount, showComments, fetchItemComments]);

  const { isSubscribed, error: realtimeError } = useItemRealtimeUpdates(itemId, refreshItemData);

  useEffect(() => {
    setIsRealtimeSubscribed(isSubscribed);
  }, [isSubscribed]);

  return {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    interactionsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    interestedError,
    handleLike,
    handleCommentToggle,
    handleShowInterest,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    fetchItemComments,
    refreshComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData
  };
};
