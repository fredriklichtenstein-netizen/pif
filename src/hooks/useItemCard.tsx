
import { useState, useEffect } from "react";
import { useItemInteractions, User } from "./item/useItemInteractions";
import { useComments } from "./item/useComments";
import { useItemActions } from "./item/useItemActions";
import { Comment } from "@/types/comment";

export const useItemCard = (itemId: string) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [likers, setLikers] = useState<User[]>([]);
  const [commenters, setCommenters] = useState<User[]>([]);
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
  } = useItemInteractions(itemId);

  const { handleMessage, handleShare, handleReport } = useItemActions(itemId);

  // Comments management
  const {
    fetchComments,
    fetchCommentsCount,
    fetchCommenters,
  } = useComments(itemId);

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
  }, [itemId]);
  
  // Fetch likers when component mounts or when like count changes
  useEffect(() => {
    const getLikers = async () => {
      if (likesCount > 0) {
        const users = await fetchLikers();
        setLikers(users);
      }
    };
    
    getLikers();
  }, [likesCount]);
  
  // Fetch commenters when component mounts or when comments count changes
  useEffect(() => {
    const getCommenters = async () => {
      if (commentsCount > 0) {
        const users = await fetchCommenters();
        setCommenters(users);
      }
    };
    
    getCommenters();
  }, [commentsCount]);

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
