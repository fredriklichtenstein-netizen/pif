
import { Comment } from "@/types/comment";
import { CommentCard } from "./CommentCard";

interface CommentListProps {
  comments: Comment[];
  isLoading: boolean;
  currentUserId?: string;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, newText: string) => void;
  onReply: (commentId: string, text: string) => void;
  onReport: (commentId: string) => void;
}

export function CommentList({
  comments,
  isLoading,
  currentUserId,
  onLike,
  onDelete,
  onEdit,
  onReply,
  onReport
}: CommentListProps) {
  if (isLoading) {
    return <div className="mt-4 py-4 text-center text-gray-500">Loading comments...</div>;
  }

  if (comments.length === 0) {
    return <div className="py-4 text-center text-gray-500">No comments yet. Be the first to comment!</div>;
  }

  return (
    <div className="space-y-4">
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
