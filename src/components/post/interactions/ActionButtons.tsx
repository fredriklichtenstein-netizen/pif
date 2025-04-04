
import { ThumbsUp, MessageCircle, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActionButtonsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  isRealtimeSubscribed?: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function ActionButtons({ 
  isLiked, 
  showComments, 
  showInterest, 
  isOwner, 
  isRealtimeSubscribed = false,
  onLikeToggle, 
  onCommentToggle, 
  onShowInterest 
}: ActionButtonsProps) {
  return (
    <div className="flex justify-between items-center border-b border-gray-200 pb-2">
      <div className="flex gap-2">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onLikeToggle}
          className={`flex items-center gap-1 ${isLiked ? 'text-primary' : 'text-gray-600'}`}
        >
          <ThumbsUp size={18} />
          <span>{isLiked ? 'Liked' : 'Like'}</span>
        </Button>
        
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onCommentToggle}
          className={`flex items-center gap-1 ${showComments ? 'text-primary' : 'text-gray-600'}`}
        >
          <MessageCircle size={18} />
          <span>Comment</span>
        </Button>
        
        {!isOwner && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onShowInterest}
            className={`flex items-center gap-1 ${showInterest ? 'text-primary' : 'text-gray-600'}`}
            disabled={showInterest}
          >
            <Heart size={18} />
            <span>{showInterest ? 'Interested' : 'Show Interest'}</span>
          </Button>
        )}
      </div>
      
      {isRealtimeSubscribed && (
        <div className="text-xs text-green-600 font-medium flex items-center gap-1">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          Live
        </div>
      )}
    </div>
  );
}
