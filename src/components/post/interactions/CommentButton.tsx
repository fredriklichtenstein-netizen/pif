
import { MessageCircle } from "lucide-react";

interface CommentButtonProps {
  onCommentToggle: () => void;
  commentsCount?: number;
}

export function CommentButton({ onCommentToggle, commentsCount = 0 }: CommentButtonProps) {
  return (
    <button 
      onClick={onCommentToggle}
      className="flex items-center space-x-1 text-gray-500"
      aria-label="Toggle comments"
    >
      <MessageCircle className="h-5 w-5" />
      {commentsCount > 0 && (
        <span className="text-xs font-medium">{commentsCount}</span>
      )}
    </button>
  );
}
