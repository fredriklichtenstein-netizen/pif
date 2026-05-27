
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";

export const useCommentInteractions = (
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: { id?: string; name?: string; avatar?: string; }
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();

  // Find a comment by id, walking into replies (two levels max).
  const findComment = (id: string): { parentId: string | null; comment: Comment } | null => {
    for (const c of comments) {
      if (c.id === id) return { parentId: null, comment: c };
      const r = c.replies?.find(r => r.id === id);
      if (r) return { parentId: c.id, comment: r };
    }
    return null;
  };

  const updateCommentInTree = (id: string, updater: (c: Comment) => Comment) => {
    setComments(comments.map(c => {
      if (c.id === id) return updater(c);
      if (c.replies?.some(r => r.id === id)) {
        return { ...c, replies: c.replies.map(r => r.id === id ? updater(r) : r) };
      }
      return c;
    }));
  };

  const handleLikeComment = async (commentId: string) => {
    const found = findComment(commentId);
    if (!found) return;

    if (DEMO_MODE) {
      updateCommentInTree(commentId, (c) => {
        const liked = !c.isLiked;
        return { ...c, isLiked: liked, likes: liked ? c.likes + 1 : Math.max(0, c.likes - 1) };
      });
      return;
    }

    if (!user?.id) {
      toast({ title: t('comments.login_to_comment'), variant: "default" });
      return;
    }

    const wasLiked = found.comment.isLiked;
    // Optimistic update
    updateCommentInTree(commentId, (c) => ({
      ...c,
      isLiked: !wasLiked,
      likes: !wasLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
    }));

    try {
      const numericId = parseInt(commentId, 10);
      if (isNaN(numericId)) throw new Error("Invalid comment id");

      if (wasLiked) {
        const { error } = await (supabase as any)
          .from('comment_likes')
          .delete()
          .eq('comment_id', numericId)
          .eq('user_id', user.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('comment_likes')
          .insert({ comment_id: numericId, user_id: user.id });
        // Ignore unique-violation duplicates.
        if (error && (error as any).code !== '23505') throw error;
      }
    } catch (err) {
      console.error("comment like failed, reverting:", err);
      // Revert on failure
      updateCommentInTree(commentId, (c) => ({
        ...c,
        isLiked: wasLiked,
        likes: wasLiked ? c.likes + 1 : Math.max(0, c.likes - 1),
      }));
    }
  };

  // Reply handler is intentionally a no-op here; the panel routes replies
  // through useCommentCreate (DB-backed) so they persist + go realtime.
  const handleReplyToComment = (_commentId: string, _text: string) => {
    /* handled at the panel level */
  };

  // No-op: the actual report flow runs through ReportPostDialog, which
  // shows its own success toast only after a successful submission.
  const handleReportComment = (_commentId: string) => {};

  return { handleLikeComment, handleReplyToComment, handleReportComment };
};
