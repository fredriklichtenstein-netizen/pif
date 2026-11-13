
import { CommentSection } from "@/components/post/CommentSection";
import { Comment } from "@/types/comment";
import { CommentsReadOnlyContext } from "@/components/comments/CommentsReadOnly";

interface ItemCommentsSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  isLoading: boolean;
  error: Error | null;
  isVisible: boolean;
  /** Completed/archived post: comments are shown but can't be added to. */
  readOnly?: boolean;
}

export const ItemCommentsSection = ({ 
  itemId, 
  comments, 
  setComments, 
  isLoading, 
  error,
  isVisible,
  readOnly = false,
}: ItemCommentsSectionProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="mt-3">
      <CommentsReadOnlyContext.Provider value={readOnly}>
        <CommentSection
          itemId={itemId}
          comments={comments}
          setComments={setComments}
          isLoading={isLoading}
          error={error}
        />
      </CommentsReadOnlyContext.Provider>
    </div>
  );
};
