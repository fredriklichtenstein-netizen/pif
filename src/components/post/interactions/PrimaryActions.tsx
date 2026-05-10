
import { User } from "@/hooks/item/useItemInteractions";
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { ShareButton } from "./button/ShareButton";
import { useTranslation } from 'react-i18next';
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import {
  fetchLikersPage,
  fetchInterestedUsersPage,
  fetchCommentersPage,
} from "@/services/interactions/fetchPaginatedUsers";

interface PrimaryActionsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  itemId: string;
  itemOwnerId?: string;
  itemType?: 'offer' | 'request';
  itemTitle?: string;
  currentUserId?: string;
  hasCommented?: boolean;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  interestedUsers?: User[];
  commenters?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: (note?: string) => void;
  onShare: () => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
  fetchCommenters?: () => Promise<User[]>;
}

export function PrimaryActions({
  isLiked,
  showComments,
  showInterest,
  isOwner,
  itemId,
  itemOwnerId,
  itemType,
  itemTitle,
  currentUserId,
  hasCommented = false,
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
}: PrimaryActionsProps) {
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const effectiveCurrentUserId = currentUserId ?? user?.id;
  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onShare();
  };

  // Per-type paginated fetchers used by the popovers. Each closure
  // captures the item id so the popover can request page after page
  // without ever loading the full list upfront.
  const fetchLikersPageFn = (offset: number) => fetchLikersPage(itemId, offset);
  const fetchInterestedPageFn = (offset: number) =>
    fetchInterestedUsersPage(itemId, offset);
  const fetchCommentersPageFn = (offset: number, seen?: Set<string>) =>
    fetchCommentersPage(itemId, offset, undefined, seen);

  return (
    <div className="grid grid-cols-4 w-full gap-1 mb-1">
      <div className="flex justify-center">
        <InteractionButtonWithPopup
          type="like"
          isActive={isLiked}
          count={likesCount}
          users={likers}
          onClick={onLikeToggle}
          onCounterClick={fetchLikers}
          fetchPage={fetchLikersPageFn}
          isOwner={isOwner}
          labelPassive={t('interactions.like')}
          labelActive={t('interactions.liked')}
          iconPassive="heart"
          iconActive="heart"
          itemId={itemId}
        />
      </div>
      
      <div className="flex justify-center">
        <InteractionButtonWithPopup
          type="comment"
          isActive={hasCommented}
          count={commentsCount}
          users={commenters}
          fetchPage={fetchCommentersPageFn}
          itemId={itemId}
          onClick={onCommentToggle}
          labelPassive={t('interactions.comment')}
          labelActive={t('interactions.commented')}
          iconPassive="message-square"
          iconActive="message-square"
          isOwner={false}
        />
      </div>
      
      <div className="flex justify-center">
        <ShareButton
          itemId={itemId}
          onShareClick={handleShareClick}
          disabled={false}
        />
      </div>
      
      <div className="flex justify-center">
        <InteractionButtonWithPopup
          type="interest"
          isActive={showInterest}
          count={interestsCount}
          users={interestedUsers}
          onClick={onShowInterest}
          onCounterClick={fetchInterestedUsers}
          fetchPage={fetchInterestedPageFn}
          isOwner={isOwner}
          labelPassive={
            itemType === 'request'
              ? t('interactions.grant_wish', 'Grant wish')
              : t('interactions.interest')
          }
          labelActive={
            itemType === 'request'
              ? t('interactions.granting', 'Granting')
              : t('interactions.interested')
          }
          iconPassive={itemType === 'request' ? 'sparkles' : 'star'}
          iconActive={itemType === 'request' ? 'sparkles' : 'star'}
          itemId={itemId}
          itemOwnerId={itemOwnerId}
          currentUserId={effectiveCurrentUserId}
          itemType={itemType}
          itemTitle={itemTitle}
        />
      </div>
    </div>
  );
}
