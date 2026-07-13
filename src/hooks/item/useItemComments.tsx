
import { useState, useCallback, useEffect } from "react";
import { useComments } from "./useComments";
import { Comment } from "@/types/comment";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import { useMyCommentedStore } from "@/stores/myCommentedStore";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { supabase } from "@/integrations/supabase/client";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";
import { DEMO_MODE } from "@/config/demoMode";

// `comments` is a nested tree — top-level rows with replies attached under
// `.replies` — so `comments.length` alone silently excludes every reply.
// Both the visible counter and the "have I commented" check need to count
// (or search) the full tree, not just its top-level entries.
const countAllComments = (list: Comment[]): number =>
  list.reduce((sum, c) => sum + 1 + (c.replies?.length ?? 0), 0);

const hasAuthor = (list: Comment[], userId: string): boolean =>
  list.some((c) => c.author?.id === userId || c.replies?.some((r) => r.author?.id === userId));

export const useItemComments = (itemId: string) => {
  const { user } = useGlobalAuth();
  const userId = user?.id;
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState<Error | null>(null);
  const [commentsFetched, setCommentsFetched] = useState(false);

  const { fetchComments } = useComments(itemId);

  // Prefer the bulk-fetched count from the feed query so the counter is
  // immediately correct, even before the user opens the comments section.
  // Once comments have actually been fetched locally, prefer the larger of
  // the two so optimistic inserts/refetches keep the counter in sync.
  const initialCount = useInitialCountsStore(
    (s) => s.counts[String(itemId)]?.commentsCount
  );
  const commentsCount = commentsFetched
    ? Math.max(countAllComments(comments), initialCount ?? 0)
    : (initialCount ?? countAllComments(comments));

  // Eager "have I commented" state — mirrors useLikes/useInterests so the
  // button's active state is correct on mount instead of only becoming
  // known after the full comment thread has been lazily fetched (which
  // previously only happened once the user opened the comments section).
  const myCommentedRealtime = useMyCommentedStore((s) => s.byItem[String(itemId)]);
  const setMyCommented = useMyCommentedStore((s) => s.set);
  const [hasCommented, setHasCommented] = useState(
    typeof myCommentedRealtime === "boolean" ? myCommentedRealtime : false
  );

  useEffect(() => {
    if (typeof myCommentedRealtime === "boolean") setHasCommented(myCommentedRealtime);
  }, [myCommentedRealtime]);

  // Per-card fallback: only needed if the bulk store hasn't seen this item
  // yet (e.g. opened directly via a permalink, outside the feed's prefetch).
  useEffect(() => {
    if (DEMO_MODE) return;
    if (typeof myCommentedRealtime === "boolean") return;
    if (!userId || !itemId) return;
    if (isAuthRequestCircuitOpen()) return;
    const numericId = parseInt(itemId, 10);
    if (isNaN(numericId)) return;
    let cancelled = false;
    (async () => {
      try {
        const { data, error } = await supabase
          .from("comments")
          .select("id")
          .eq("item_id", numericId)
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        if (cancelled) return;
        if (error) {
          maybeRecoverFromAuthError(error, "useItemComments hasCommented fetch");
          return;
        }
        setHasCommented(!!data);
        setMyCommented(itemId, !!data);
      } catch (err) {
        if (!cancelled) maybeRecoverFromAuthError(err, "useItemComments hasCommented fetch");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [itemId, userId, myCommentedRealtime, setMyCommented]);

  // Once the full thread has actually been fetched locally, reconcile from
  // ground truth — covers deletions and cross-checks the eager signal.
  useEffect(() => {
    if (!commentsFetched || !userId) return;
    const actuallyCommented = hasAuthor(comments, userId);
    setHasCommented(actuallyCommented);
    setMyCommented(itemId, actuallyCommented);
  }, [commentsFetched, comments, userId, itemId, setMyCommented]);

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
      // Sync the bulk store so the feed counter reflects the latest count.
      // Must count replies too — `list` is a nested tree, and list.length
      // alone would silently drop every reply from the shared counter.
      useInitialCountsStore.getState().setBulkCounts([
        { itemId: itemId, commentsCount: countAllComments(list) },
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
    setCommentsCount,
    hasCommented
  };
};
