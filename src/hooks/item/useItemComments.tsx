
import { useState, useCallback } from "react";
import { useComments } from "./useComments";
import { Comment } from "@/types/comment";

export const useItemComments = (itemId: string) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<Error | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);

  const { fetchComments } = useComments(itemId);

  // Always derive count directly from the comments array
  const commentsCount = comments.length;

  const fetchItemComments = useCallback(async () => {
    if (!itemId) return;
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const fetchedComments = await fetchComments();
      // Replace local state entirely so count stays in sync
      setComments(Array.isArray(fetchedComments) ? fetchedComments : []);
      setCommentsFetched(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentsError(error instanceof Error ? error : new Error('Unknown error fetching comments'));
    } finally {
      setCommentsLoading(false);
    }
  }, [itemId, fetchComments]);

  const handleCommentToggle = useCallback(() => {
    const isOpening = !showComments;
    setShowComments(isOpening);
    if (isOpening && (!commentsFetched || comments.length === 0)) {
      fetchItemComments();
    }
  }, [showComments, commentsFetched, comments.length, fetchItemComments]);

  // No-op kept for API compatibility — count is derived from comments.length
  const setCommentsCount = useCallback((_n: number) => {}, []);

  return {
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    setComments,
    handleCommentToggle,
    fetchItemComments,
    setCommentsCount
  };
};
