
import { User } from "@/hooks/item/useItemInteractions";
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { useShare } from "@/hooks/useShare";
import { Share } from "lucide-react";

interface PrimaryActionsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  itemId: string;
  currentUserId?: string;
  hasCommented?: boolean;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  interestedUsers?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
}

export function PrimaryActions({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  itemId,
  hasCommented = false,
  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  interestedUsers = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  fetchLikers,
  fetchInterestedUsers,
}: PrimaryActionsProps) {
  const { shareContent } = useShare();
  
  const handleShare = async () => {
    const baseUrl = window.location.origin;
    const itemUrl = `${baseUrl}/item/${itemId}`;
    
    await shareContent({
      title: 'Check out this PIF item',
      text: 'I found this interesting item on PIF Community',
      url: itemUrl
    });
  };

  return (
    <div className="flex justify-between w-full pt-1 gap-3">
      <InteractionButtonWithPopup
        type="like"
        isActive={isLiked}
        count={likesCount}
        users={likers}
        onClick={onLikeToggle}
        onCounterClick={fetchLikers}
        isOwner={isOwner}
        labelPassive="Like"
        labelActive="Liked"
        iconPassive="heart"
        iconActive="heart"
        itemId={itemId}
      />
      <InteractionButtonWithPopup
        type="comment"
        isActive={hasCommented}
        count={commentsCount}
        itemId={itemId}
        onClick={onCommentToggle}
        labelPassive="Comment"
        labelActive="Commented"
        iconPassive="message-square"
        iconActive="message-square"
        isOwner={false}
      />
      
      {/* Custom share button that matches the other interaction buttons */}
      <div className="relative flex flex-col items-center group" style={{ minWidth: 74 }}>
        <button 
          aria-label="Share"
          className="flex flex-col items-center rounded cursor-pointer"
          onClick={handleShare}
        >
          <div className="flex items-center justify-center" style={{ height: 28, width: 32 }}>
            <Share className="w-6 h-6 flex-shrink-0" stroke="#333333" strokeWidth={2} />
          </div>
          <div className="flex flex-row items-center justify-center mt-1 min-h-[22px]">
            <span className="text-xs font-medium select-none mx-[4px]" style={{ color: "#333333" }}>
              Share
            </span>
          </div>
        </button>
      </div>
      
      <InteractionButtonWithPopup
        type="interest"
        isActive={showInterest}
        count={interestsCount}
        users={interestedUsers}
        onClick={onShowInterest}
        onCounterClick={fetchInterestedUsers}
        isOwner={isOwner}
        labelPassive="Show interest"
        labelActive="Interested"
        iconPassive="star"
        iconActive="star"
        itemId={itemId}
      />
    </div>
  );
}
