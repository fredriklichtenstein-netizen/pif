
import { useCallback } from "react";
import { useItemComments } from "./useItemComments";
import { useCommentCountRealtime } from "@/hooks/comments/useCommentCountRealtime";

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
    setCommentsCount,
    hasCommented
  } = useItemComments(itemId);

  // Method to refresh comments data when needed
  const refreshComments = useCallback(() => {
    if (showComments) {
      fetchItemComments();
    }
  }, [showComments, fetchItemComments]);

  // Live-update the counter (and refetch the open list) whenever a
  // comment is inserted or deleted server-side, without requiring the
  // user to reopen the comments section.
  useCommentCountRealtime(itemId, () => {
    if (showComments) {
      fetchItemComments();
    }
  });

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
    refreshComments,
    hasCommented
  };
};
