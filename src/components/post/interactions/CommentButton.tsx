
import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { LazyCommentsSection } from "@/components/comments/LazyCommentsSection";

interface CommentButtonProps {
  onCommentToggle: () => void;
  commentsCount?: number;
  itemId: string;
  showComments: boolean;
}

export function CommentButton({ 
  onCommentToggle, 
  commentsCount = 0,
  itemId,
  showComments
}: CommentButtonProps) {
  
  const handleCommentClick = () => {
    console.log(`CommentButton: Toggling comments for item ${itemId}`);
    onCommentToggle();
  };
  
  // Debug logging when component mounts or updates
  useEffect(() => {
    console.log(`CommentButton rendered for item ${itemId}, showComments: ${showComments}`);
  }, [itemId, showComments]);
  
  return (
    <>
      <button 
        onClick={handleCommentClick}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label="Toggle comments"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">
          {commentsCount > 0 ? `Comments (${commentsCount})` : 'Comment'}
        </span>
      </button>
      
      {/* We render the LazyCommentsSection only when showComments is true */}
      {showComments && (
        <div className="mt-4">
          <LazyCommentsSection 
            itemId={itemId}
            isVisible={showComments}
            onClose={onCommentToggle}
          />
        </div>
      )}
    </>
  );
}
