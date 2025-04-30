
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { ShareButton } from "./ShareButton";
import type { User } from "@/hooks/item/useItemInteractions";

interface ActionButtonsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  isRealtimeSubscribed?: boolean;
  itemId: string;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  interestedUsers?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onShare: (e: React.MouseEvent) => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
}

export function ActionButtons({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  isRealtimeSubscribed = false,
  itemId,
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
  fetchInterestedUsers
}: ActionButtonsProps) {
  return (
    <div className="flex flex-row border-t border-b border-gray-100 py-1">
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
        isActive={showComments}
        count={commentsCount}
        onClick={onCommentToggle}
        isOwner={false} // Anyone can comment
        labelPassive="Comment"
        labelActive="Comment"
        iconPassive="message-square"
        iconActive="message-square"
        itemId={itemId}
      />
      
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
      
      <div className="relative flex flex-col items-center flex-1 min-w-[60px]">
        <button
          onClick={e => onShare(e)}
          aria-label="Share"
          className="flex flex-col items-center w-full rounded cursor-pointer group"
        >
          <div className="flex items-center justify-center h-7">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-share"><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><polyline points="16 6 12 2 8 6"/><line x1="12" x2="12" y1="2" y2="15"/></svg>
          </div>
          <div className="flex flex-row items-center justify-center mt-1">
            <span className="text-xs font-medium select-none text-gray-800">
              Share
            </span>
          </div>
        </button>
      </div>
    </div>
  );
}
