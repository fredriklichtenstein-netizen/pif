
import { useState, useEffect } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useComments } from "./item/useComments";
import { useCommentData } from "./comments/useCommentData";
import { Comment } from "@/types/comment";

export const useItemCard = (id: string) => {
  const {
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleBookmark,
  } = useItemInteractions(id);

  const {
    handleMessage,
    handleShare,
    handleReport,
  } = useItemActions();

  const {
    showComments,
    comments: localComments,
    handleCommentToggle,
    setComments,
  } = useComments();

  // Fetch comments from the database
  const { comments: fetchedComments, isLoading: commentsLoading } = useCommentData(id);
  
  // Update local comments state when fetched comments change
  useEffect(() => {
    if (fetchedComments && fetchedComments.length > 0) {
      console.log(`Setting ${fetchedComments.length} comments in useItemCard for item ${id}`);
      setComments(fetchedComments);
    }
  }, [fetchedComments, setComments, id]);

  return {
    isLiked,
    likesCount,
    showComments,
    comments: localComments, // Explicitly use localComments to be clear
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  };
};
