
import { useState, useCallback } from "react";
import { useComments } from "./useComments";
import { Comment } from "@/types/comment";
import { useInitialCountsStore } from "@/stores/initialCountsStore";

export const useItemComments = (itemId: string) => {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<Error | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);

  const { fetchComments } = useComments(itemId);

  // Use bulk-fetched count from feed load until comments are actually fetched.
  const initialCount = useInitialCountsStore(
    (s) => s.counts[String(itemId)]?.commentsCount
  );
  const commentsCount = commentsFetched
    ? comments.length
    : (initialCount ?? comments.length);

  const fetchItemComments = useCallback(async () => {
    if (!itemId) return;
    setCommentsLoading(true);
    setCommentsError(null);

    try {
      const fetchedComments = await fetchComments();
      const list = Array.isArray(fetchedComments) ? fetchedComments : [];
      // Replace local state entirely so count stays in sync
      setComments(list);
      setCommentsFetched(true);
      // Sync the bulk store so the feed counter reflects the latest count
      useInitialCountsStore.getState().setBulkCounts([
        { itemId: itemId, commentsCount: list.length },
      ]);
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
    if (isOpening) {
      // Always force a fresh fetch when opening so users see new comments from others
      setCommentsFetched(false);
      fetchItemComments();
    }
  }, [showComments, fetchItemComments]);

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
