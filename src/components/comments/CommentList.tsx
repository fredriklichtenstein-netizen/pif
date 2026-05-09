
import { useEffect, useRef } from "react";
import { Comment } from "@/types/comment";
import { CommentCard } from "./CommentCard";
import { useTranslation } from 'react-i18next';

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  currentUserId?: string;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newText: string) => void;
  onReply: (commentId: string, text: string) => void;
  onReport: (commentId: string) => void;
  newCommentId?: string | null;
}

export function CommentList({
  comments,
  isLoading,
  currentUserId,
  onLike,
  onDelete,
  onEdit,
  onReply,
  onReport,
  newCommentId,
}: CommentListProps) {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrolledIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!newCommentId || !containerRef.current) return;
    if (lastScrolledIdRef.current === newCommentId) return;
    const el = containerRef.current.querySelector<HTMLElement>(
      `[data-comment-id="${CSS.escape(newCommentId)}"]`
    );
    if (!el) return;
    lastScrolledIdRef.current = newCommentId;

    // Only scroll if it's not already in view — otherwise let it just appear.
    const rect = el.getBoundingClientRect();
    const inView = rect.top >= 0 && rect.bottom <= window.innerHeight;
    if (!inView) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [newCommentId, comments]);

  if (isLoading) {
    return <div className="mt-4 py-4 text-center text-gray-500">{t('comments.loading')}</div>;
  }

  if (comments.length === 0) {
    return <div className="py-4 text-center text-gray-500">{t('comments.no_comments')}</div>;
  }

  return (
    <div ref={containerRef} className="space-y-4">
      {comments.map((comment) => (
        <CommentCard
          key={comment.id}
          comment={comment}
          onLike={onLike}
          onDelete={onDelete}
          onEdit={onEdit}
          onReply={onReply}
          onReport={onReport}
          currentUser={currentUserId}
        />
      ))}
    </div>
  );
}
