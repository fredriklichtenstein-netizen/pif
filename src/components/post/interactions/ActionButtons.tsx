
import { LikeButton } from "./LikeButton";
import { CommentButton } from "./CommentButton";
import { InterestButton } from "./InterestButton";

interface ActionButtonsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  isRealtimeSubscribed?: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  itemId: string;
  commentsCount?: number;
}

export function ActionButtons({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  isRealtimeSubscribed,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  itemId,
  commentsCount = 0
}: ActionButtonsProps) {
  return (
    <div className="flex items-center gap-2 py-2">
      <LikeButton isLiked={isLiked} onLikeToggle={onLikeToggle} />
      
      <CommentButton 
        onCommentToggle={onCommentToggle} 
        commentsCount={commentsCount}
        itemId={itemId}
        showComments={showComments}
      />
      
      {!isOwner && (
        <InterestButton 
          isInterested={showInterest} 
          onInterestToggle={onShowInterest} 
        />
      )}
    </div>
  );
}
