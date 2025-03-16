
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { useCommentData } from "@/hooks/comments/useCommentData";
import { useCommentActions } from "@/hooks/comments/useCommentActions";

interface CommentSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
}

export function CommentSection({ itemId, comments, setComments }: CommentSectionProps) {
  const { isLoading, currentUser } = useCommentData(itemId);
  
  const {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment
  } = useCommentActions(itemId, comments, setComments, currentUser);

  return (
    <div className="mt-4 space-y-4">
      <CommentInput onSubmit={handleAddComment} placeholder="Write a comment..." />
      <CommentList
        comments={comments}
        isLoading={isLoading}
        currentUserId={currentUser.id}
        onLike={handleLikeComment}
        onDelete={handleDeleteComment}
        onEdit={handleEditComment}
        onReply={handleReplyToComment}
        onReport={handleReportComment}
      />
    </div>
  );
}
