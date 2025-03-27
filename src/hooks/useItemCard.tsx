
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
  const [commentsFetched, setCommentsFetched] = useState(false);

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
  } = useItemInteractions(itemId);

  const { handleMessage, handleShare, handleReport } = useItemActions();

  // Comments management
  const {
    fetchComments,
    fetchCommentsCount,
    fetchCommenters,
  } = useComments(itemId);

  // Users who interacted with the item
  const { likers, commenters, interestedUsers } = useItemUsers(
    comments, 
    fetchLikers, 
    likesCount,
    fetchInterestedUsers,
    interestsCount
  );

  // Fetch comments for the item - memoize with useCallback to prevent infinite loops
  const fetchItemComments = useCallback(async () => {
    if (commentsFetched) return;
    
    console.log(`Fetching comments for item ${itemId}`);
    setCommentsLoading(true);
    try {
      const fetchedComments = await fetchComments();
      console.log(`Fetched ${fetchedComments.length} comments for item ${itemId}`);
      setComments(fetchedComments);
      setCommentsFetched(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  }, [itemId, fetchComments, commentsFetched]);

  // Toggle showing comments
  const handleCommentToggle = useCallback(() => {
    console.log(`Toggling comments for item ${itemId}`);
    setShowComments(!showComments);
    
    // Make sure we have comments when opening the section
    if (!showComments && !commentsFetched) {
      fetchItemComments();
    }
  }, [showComments, commentsFetched, fetchItemComments, itemId]);

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
    
    getCommentsCount();
  }, [itemId, fetchCommentsCount]);

  return {
    // States
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
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
  };
};
