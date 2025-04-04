
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
  return (
    <div className="flex items-center justify-between py-[5px]">
      {/* Hide Like button for own posts but maintain the layout */}
      {isOwner ? (
        <div className="flex-1"></div>
      ) : (
        <button 
          onClick={onLikeToggle}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
            isLiked ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <ThumbsUp className={`h-5 w-5 mr-2 ${isLiked ? 'fill-primary' : ''}`} />
          <span className="font-medium">Like</span>
        </button>
      )}
      
      <button 
        onClick={onCommentToggle}
        className={`flex-1 flex items-center justify-center py-2 rounded-md ${
          showComments ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
        } transition-colors`}
      >
        <MessageCircle className="h-5 w-5 mr-2" />
        <span className="font-medium">Comment</span>
      </button>
      
      {/* Hide Interest button for own posts but maintain the layout */}
      {isOwner ? (
        <div className="flex-1"></div>
      ) : (
        <button 
          onClick={onShowInterest}
          className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
            showInterest ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Heart className={`h-5 w-5 mr-2 ${showInterest ? 'fill-primary' : ''}`} />
          <span className="font-medium">{showInterest ? 'Interested' : 'Interest'}</span>
        </button>
      )}
    </div>
  );
}
