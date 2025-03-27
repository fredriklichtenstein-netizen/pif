
import { MessageCircle } from "lucide-react";

interface CommentButtonProps {
  onCommentToggle: () => void;
  commentsCount?: number;
}

export function CommentButton({ 
  onCommentToggle, 
  commentsCount = 0
}: CommentButtonProps) {
  
  const handleCommentClick = () => {
    onCommentToggle();
  };
  
  return (
    <button 
      onClick={handleCommentClick}
      className="flex items-center gap-1.5 rounded-md px-2 py-1 text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label="Toggle comments"
    >
      <MessageCircle className="h-4 w-4" />
      <span className="text-xs font-medium">
        {commentsCount > 0 ? `Comments (${commentsCount})` : 'Comment'}
      </span>
    </button>
  );
}
