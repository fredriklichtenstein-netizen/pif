
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { ShareButton } from "./ShareButton";
import {
  fetchLikersPage,
  fetchInterestedUsersPage,
  fetchCommentersPage,
} from "@/services/interactions/fetchPaginatedUsers";
import type { User } from "@/hooks/item/useItemInteractions";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

interface ActionButtonsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  isRealtimeSubscribed?: boolean;
  itemId: string;
  itemOwnerId?: string;
  currentUserId?: string;
  /** Required for the interest popup to scope withdraw_pif by fulfiller on wishes. */
  itemType?: 'offer' | 'request';
  itemTitle?: string;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  interestedUsers?: User[];
  commenters?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onShare: (e: React.MouseEvent) => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
  fetchCommenters?: () => Promise<User[]>;
}


export function ActionButtons({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  isRealtimeSubscribed = false,
  itemId,
  itemOwnerId,
  currentUserId,
  itemType,
  itemTitle,

  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  interestedUsers = [],
  commenters = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onShare,
  fetchLikers,
  fetchInterestedUsers,
  fetchCommenters,
}: ActionButtonsProps) {
  const { user } = useGlobalAuth();
  const effectiveCurrentUserId = currentUserId ?? user?.id;
  const fetchLikersPageFn = (offset: number) => fetchLikersPage(itemId, offset);
  const fetchInterestedPageFn = (offset: number) =>
    fetchInterestedUsersPage(itemId, offset);
  const fetchCommentersPageFn = (offset: number, seen?: Set<string>) =>
    fetchCommentersPage(itemId, offset, undefined, seen);
  return (
    <div className="flex flex-row border-t border-b border-gray-100 py-1">
      <InteractionButtonWithPopup
        type="like"
        isActive={isLiked}
        count={likesCount}
        users={likers}
        onClick={onLikeToggle}
        onCounterClick={fetchLikers}
        fetchPage={fetchLikersPageFn}
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
        users={commenters}
        fetchPage={fetchCommentersPageFn}
        onClick={onCommentToggle}
        isOwner={false}
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
        fetchPage={fetchInterestedPageFn}
        isOwner={isOwner}
        labelPassive="Interest"
        labelActive="Interested"
        iconPassive="star"
        iconActive="star"
        itemId={itemId}
        itemOwnerId={itemOwnerId}
        currentUserId={effectiveCurrentUserId}
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
