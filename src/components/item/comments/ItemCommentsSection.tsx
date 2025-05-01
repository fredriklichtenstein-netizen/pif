
import { CommentSection } from "@/components/post/CommentSection";
import { Comment } from "@/types/comment";

interface ItemCommentsSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  isLoading: boolean;
  error: Error | null;
  isVisible: boolean;
}

export const ItemCommentsSection = ({ 
  itemId, 
  comments, 
  setComments, 
  isLoading, 
  error,
  isVisible 
}: ItemCommentsSectionProps) => {
  if (!isVisible) return null;
  
  return (
    <div className="mt-3">
      <CommentSection
        itemId={itemId}
        comments={comments}
        setComments={setComments}
        isLoading={isLoading}
        error={error}
      />
    </div>
  );
};
