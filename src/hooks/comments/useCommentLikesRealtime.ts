import { useEffect, useRef } from "react";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { subscribeCommentLikes } from "@/services/realtime/commentLikesManager";

/**
 * Subscribe to comment_likes changes for the comments currently in view.
 * Updates `likes` and `isLiked` in place via setComments — no refetch.
 *
 * Uses the shared global comment_likes channel — every mounted instance
 * fans off the same Supabase subscription instead of opening its own.
 */
export const useCommentLikesRealtime = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void
) => {
  const { user } = useGlobalAuth();
  const commentsRef = useRef(comments);
  commentsRef.current = comments;

  useEffect(() => {
    if (!itemId) return;

    const unsubscribe = subscribeCommentLikes((payload: any) => {
      const row = payload.new ?? payload.old;
      if (!row?.comment_id) return;
      const targetId = String(row.comment_id);
      const isInsert = payload.eventType === "INSERT";
      const isDelete = payload.eventType === "DELETE";
      if (!isInsert && !isDelete) return;

      const list = commentsRef.current;
      const findInTree = (): Comment | undefined => {
        for (const c of list) {
          if (c.id === targetId) return c;
          const r = c.replies?.find(r => r.id === targetId);
          if (r) return r;
        }
        return undefined;
      };
      const target = findInTree();
      if (!target) return;

      const isMine = !!user?.id && row.user_id === user.id;
      // Skip if our own optimistic update has already applied this change.
      if (isMine && ((isInsert && target.isLiked) || (isDelete && !target.isLiked))) {
        return;
      }

      const updateNode = (c: Comment): Comment => {
        if (c.id !== targetId) return c;
        const next = { ...c };
        next.likes = Math.max(0, c.likes + (isInsert ? 1 : -1));
        if (isMine) next.isLiked = isInsert;
        return next;
      };

      setComments(
        list.map(c => {
          if (c.id === targetId) return updateNode(c);
          if (c.replies?.some(r => r.id === targetId)) {
            return { ...c, replies: c.replies.map(updateNode) };
          }
          return c;
        })
      );
    });

    return unsubscribe;
  }, [itemId, user?.id, setComments]);
};
