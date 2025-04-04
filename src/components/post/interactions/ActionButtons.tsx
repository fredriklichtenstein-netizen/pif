
import { ThumbsUp, MessageCircle, Heart } from "lucide-react";

interface ActionButtonsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function ActionButtons({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  onLikeToggle,
  onCommentToggle,
  onShowInterest
}: ActionButtonsProps) {
  // Prevent event propagation to ensure actions don't conflict
  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    onLikeToggle();
  };

  const handleComment = (e: React.MouseEvent) => {
    e.stopPropagation();
    onCommentToggle();
  };

  const handleInterest = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShowInterest();
  };

  return (
    <div className="flex items-center justify-between py-[5px]">
      {/* Hide Like button for own posts but maintain the layout */}
      {isOwner ? (
        <div className="flex-1"></div>
      ) : (
        <button 
          onClick={handleLike}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
            isLiked ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-label={isLiked ? "Unlike this post" : "Like this post"}
        >
          <ThumbsUp className={`h-5 w-5 mr-2 ${isLiked ? 'fill-primary' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
      )}
      
      <button 
        onClick={handleComment}
        className={`flex-1 flex items-center justify-center py-2 rounded-md ${
          showComments ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
        } transition-colors`}
        aria-label={showComments ? "Hide comments" : "Show comments"}
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        <span className="font-medium">Comment</span>
      </button>
      
      {/* Hide Interest button for own posts but maintain the layout */}
      {isOwner ? (
        <div className="flex-1"></div>
      ) : (
        <button 
          onClick={handleInterest}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
            showInterest ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          }`}
          aria-label={showInterest ? "Remove interest" : "Show interest"}
        >
          <Heart className={`h-5 w-5 mr-2 ${showInterest ? 'fill-primary' : ''}`} />
          <span className="font-medium">{showInterest ? 'Interested' : 'Interest'}</span>
        </button>
      )}
    </div>
  );
}
