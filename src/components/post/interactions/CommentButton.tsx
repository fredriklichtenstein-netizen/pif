
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
      <svg 
        width="24" 
        height="24" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        strokeWidth="2" 
        className="h-5 w-5"
      >
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
      </svg>
      {commentsCount > 0 && (
        <span className="text-xs font-medium">{commentsCount}</span>
      )}
    </button>
  );
}
