import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

/**
 * Subscribe to comment_likes changes for the comments currently in view.
 * Updates `likes` and `isLiked` in place via setComments — no refetch.
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

    const channel = (supabase as any)
      .channel(`comment-likes-${itemId}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "comment_likes" },
        (payload: any) => {
          const row = payload.new ?? payload.old;
          if (!row?.comment_id) return;
          const targetId = String(row.comment_id);
          const isInsert = payload.eventType === "INSERT";
          const isDelete = payload.eventType === "DELETE";
          if (!isInsert && !isDelete) return;

          const list = commentsRef.current;
          const inTree =
            list.some(c => c.id === targetId) ||
            list.some(c => c.replies?.some(r => r.id === targetId));
          if (!inTree) return;

          const isMine = user?.id && row.user_id === user.id;
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
        }
      )
      .subscribe();

    return () => {
      try { supabase.removeChannel(channel); } catch { /* noop */ }
    };
  }, [itemId, user?.id, setComments]);
};
