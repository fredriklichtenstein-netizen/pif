
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
      className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
      aria-label="Toggle comments"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="text-sm font-medium">
        {commentsCount > 0 ? `Comments (${commentsCount})` : 'Comment'}
      </span>
    </button>
  );
}
