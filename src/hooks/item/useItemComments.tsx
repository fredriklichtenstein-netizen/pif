
import { useState, useCallback } from "react";
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
