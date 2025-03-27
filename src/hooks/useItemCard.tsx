
import { useState, useEffect } from "react";
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

  // Toggle showing comments
  const handleCommentToggle = () => {
    setShowComments(!showComments);
    
    // If opening comments and we don't have them yet, fetch them
    if (!showComments && comments.length === 0) {
      fetchItemComments();
    }
  };

  // Fetch comments for the item
  const fetchItemComments = async () => {
    setCommentsLoading(true);
    try {
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setCommentsLoading(false);
    }
  };

  // Fetch comments count
  useEffect(() => {
    const getCommentsCount = async () => {
      const count = await fetchCommentsCount();
      setCommentsCount(count);
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
  };
};
