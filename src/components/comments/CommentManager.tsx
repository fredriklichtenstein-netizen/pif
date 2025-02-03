import { CommentInput } from "./CommentInput";
import { CommentCard } from "./CommentCard";
import type { Comment } from "@/types/comment";

interface CommentManagerProps {
  comments: Comment[];
  onAddComment: (text: string) => void;
  onLikeComment: (commentId: string) => void;
  onDeleteComment: (commentId: string) => void;
  onEditComment: (commentId: string, newText: string) => void;
  onReplyToComment: (commentId: string, text: string) => void;
  onReportComment: (commentId: string) => void;
}

export function CommentManager({
  comments,
  onAddComment,
  onLikeComment,
  onDeleteComment,
  onEditComment,
  onReplyToComment,
  onReportComment,
}: CommentManagerProps) {
  const handleAddComment = async (text: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      text,
      author: {
        name: "Current User",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };
    onAddComment(text);
  };

  return (
    <div className="mt-4 space-y-4">
      <CommentInput onSubmit={handleAddComment} />
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