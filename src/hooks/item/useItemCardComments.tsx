
import { useCallback } from "react";
import { useItemComments } from "./useItemComments";

/**
 * Hook that handles comment functionality for an item card
 */
export const useItemCardComments = (itemId: string) => {
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

  // Method to refresh comments data when needed
  const refreshComments = useCallback(() => {
    if (showComments) {
      fetchItemComments();
    }
  }, [showComments, fetchItemComments]);

  return {
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
  };
};
