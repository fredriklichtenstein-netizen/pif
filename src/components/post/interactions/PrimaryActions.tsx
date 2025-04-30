
import { User } from "@/hooks/item/useItemInteractions";
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { Share } from "lucide-react";
import { useState } from "react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Link } from "react-router-dom";

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
  onShare: () => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
}

export function PrimaryActions({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  itemId,
  currentUserId,
  hasCommented = false,
  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  interestedUsers = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onShare,
  fetchLikers,
  fetchInterestedUsers,
}: PrimaryActionsProps) {
  console.log("PrimaryActions rendering for item:", itemId, "with props:", { 
    isLiked, showComments, showInterest, likesCount, commentsCount, interestsCount 
  });
  
  const [shareAttempted, setShareAttempted] = useState(false);
  
  // Improved share handler with better prevention of navigation
  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Prevent any parent click handlers or navigation
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
      e.nativeEvent.preventDefault();
    }
    
    try {
      console.log("Share button clicked for item:", itemId);
      setShareAttempted(true);
      onShare();
    } catch (error) {
      console.error("Error in share handler:", error);
    }
    
    // Return false to prevent any default behavior
    return false;
  };
  
  return (
    <div className="flex justify-between w-full pt-1 gap-1 md:gap-3">
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
      
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative flex flex-col items-center" role="button" tabIndex={0}>
              <button 
                type="button"
                aria-label="Share"
                className="flex flex-col items-center rounded cursor-pointer w-full"
                onClick={handleShareClick}
              >
                <div className="flex items-center justify-center h-7">
                  <Share className="w-6 h-6 flex-shrink-0" stroke="#333333" strokeWidth={2} />
                </div>
                <div className="flex flex-row items-center justify-center mt-1">
                  <span className="text-xs font-medium select-none">
                    Share
                  </span>
                </div>
              </button>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="center" className="bg-black text-white text-xs p-2">
            {shareAttempted ? 
              "Link will be copied to clipboard if sharing isn't available" : 
              "Share this item"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <InteractionButtonWithPopup
        type="interest"
        isActive={showInterest}
        count={interestsCount}
        users={interestedUsers}
        onClick={onShowInterest}
        onCounterClick={fetchInterestedUsers}
        isOwner={isOwner}
        labelPassive="Interest"
        labelActive="Interested"
        iconPassive="star"
        iconActive="star"
        itemId={itemId}
      />
    </div>
  );
}
