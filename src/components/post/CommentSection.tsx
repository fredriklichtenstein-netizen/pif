import { CommentInput } from "../comments/CommentInput";
import { CommentCard } from "../comments/CommentCard";
import type { Comment } from "@/types/comment";

interface CommentSectionProps {
  comments: Comment[];
  showComments: boolean;
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onReplyToComment: (commentId: string, text: string) => void;
  onReportComment: (commentId: string) => void;
}

export function CommentSection({
  comments,
  showComments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onEditComment,
  onReplyToComment,
  onReportComment,
}: CommentSectionProps) {
  if (!showComments) return null;

  return (
    <div className="mt-4 space-y-4">
      <CommentInput onSubmit={onAddComment} />
      <div className="space-y-4">
        {comments.map((comment) => (
          <CommentCard
            key={comment.id}
            comment={comment}
            onLike={onLikeComment}
            onDelete={onDeleteComment}
            onEdit={onEditComment}
            onReply={onReplyToComment}
            onReport={onReportComment}
            currentUser="Current User"
          />
        ))}
      </div>
    </div>
  );
}