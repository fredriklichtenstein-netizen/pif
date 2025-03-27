
import { MessageCircle } from "lucide-react";

type Commenter = {
  id: string;
  name: string;
  avatar?: string;
};

interface CommentButtonProps {
  onCommentToggle: () => void;
  commentsCount?: number;
  commenters?: Commenter[];
}

export function CommentButton({ 
  onCommentToggle, 
  commentsCount = 0
}: CommentButtonProps) {
  
  const handleCommentClick = () => {
    onCommentToggle();
  };
  
  return (
    <div className="flex items-center">
      <button 
        onClick={handleCommentClick}
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
        aria-label="Toggle comments"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      
      {commentsCount > 0 && (
        <span className="text-xs font-medium ml-1">
          {commentsCount}
        </span>
      )}
    </div>
  );
}
