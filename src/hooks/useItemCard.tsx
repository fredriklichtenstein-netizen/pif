import { useState, useEffect, useCallback } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useComments } from "./item/useComments";
import { useItemActions } from "./item/useItemActions";
import { useItemUsers } from "./item/useItemUsers";
import { Comment } from "@/types/comment";

export const useItemCard = (itemId: string) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<Error | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);
  const [interactionsLoading, setInteractionsLoading] = useState(true);

  // Get individual interaction hooks
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
    loading: interactionsHookLoading
  } = useItemInteractions(itemId);

  const { handleMessage, handleShare, handleReport } = useItemActions();

  // Comments management
  const {
    fetchComments,
    fetchCommentsCount,
    fetchCommenters,
    isLoading: commentsHookLoading,
    error: commentsHookError
  } = useComments(itemId);

  // Update loading and error states from hooks
  useEffect(() => {
    setCommentsLoading(commentsHookLoading);
    if (commentsHookError) setCommentsError(commentsHookError);
  }, [commentsHookLoading, commentsHookError]);

  // Update interactions loading state
  useEffect(() => {
    setInteractionsLoading(interactionsHookLoading);
  }, [interactionsHookLoading]);

  // Users who interacted with the item
  const { likers, commenters, interestedUsers } = useItemUsers(
    comments, 
    fetchLikers, 
    likesCount,
    fetchInterestedUsers,
    interestsCount
  );

  // Fetch comments count
  useEffect(() => {
    const getCommentsCount = async () => {
      try {
        const count = await fetchCommentsCount();
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

  // Fetch comments for the item - memoize with useCallback
  const fetchItemComments = useCallback(async () => {
    if (!itemId || (commentsFetched && !commentsError)) return;
    
    console.log(`Fetching comments for item ${itemId}`);
    setCommentsLoading(true);
    try {
      const fetchedComments = await fetchComments();
      console.log(`Fetched ${fetchedComments.length} comments for item ${itemId}`);
      setComments(fetchedComments);
      setCommentsFetched(true);
      setCommentsError(null);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentsError(error instanceof Error ? error : new Error('Unknown error fetching comments'));
    } finally {
      setCommentsLoading(false);
    }
  }, [itemId, fetchComments, commentsFetched, commentsError]);

  // Toggle showing comments
  const handleCommentToggle = useCallback(() => {
    console.log(`Toggling comments for item ${itemId}`);
    setShowComments(!showComments);
    
    // Make sure we have comments when opening the section
    if (!showComments) {
      fetchItemComments();
    }
  }, [showComments, fetchItemComments, itemId]);

  // Allow forcing a refresh of comments (for error recovery)
  const refreshComments = useCallback(() => {
    setCommentsFetched(false);
    fetchItemComments();
  }, [fetchItemComments]);

  return {
    // States
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
    
    // Actions
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
  };
};
