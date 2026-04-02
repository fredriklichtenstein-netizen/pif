
import { useState, useCallback, useEffect } from "react";
import { useComments } from "./useComments";
import { Comment } from "@/types/comment";

export const useItemComments = (itemId: string) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsCount, setCommentsCount] = useState(0);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<Error | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);

  const {
    fetchComments,
    error: commentsHookError
  } = useComments(itemId);

  const fetchItemComments = useCallback(async () => {
    if (!itemId) return;
    setCommentsLoading(true);
    setCommentsError(null);
    
    try {
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
      setCommentsFetched(true);
      // Also update the count to match actual comments
      setCommentsCount(fetchedComments.length);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setCommentsError(error instanceof Error ? error : new Error('Unknown error fetching comments'));
    } finally {
      setCommentsLoading(false);
    }
  }, [itemId, fetchComments]);

  // Make sure we fetch comments when toggling from closed → open
  const handleCommentToggle = useCallback(() => {
    // If we're opening comments and haven't fetched them yet (or have none)
    const isOpening = !showComments;
    setShowComments(isOpening);
    
    if (isOpening && (!commentsFetched || comments.length === 0)) {
      fetchItemComments();
    }
  }, [showComments, commentsFetched, comments.length, fetchItemComments, itemId]);

  // Make sure comments state is preserved when reopening comments
  useEffect(() => {
    // Update local commentsCount when comments array changes
    if (comments.length !== commentsCount) {
      setCommentsCount(comments.length);
    }
  }, [comments, commentsCount]);

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
