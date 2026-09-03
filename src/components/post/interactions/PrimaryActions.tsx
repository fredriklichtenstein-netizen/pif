
import { useState } from "react";
import { User } from "@/hooks/item/useItemInteractions";
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { ShareButton } from "./button/ShareButton";
import { useTranslation } from 'react-i18next';
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import {
  fetchLikersPage,
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
}: PrimaryActionsProps) {
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const effectiveCurrentUserId = currentUserId ?? user?.id;

  // Target for the like/comment/interest counter chips, portaled here from
  // InteractionButtonWithPopup instead of rendering inline next to each
  // toggle label (Trello B2 -- see CounterButton.tsx for why). A callback
  // ref (not useRef) because children need the real DOM node to portal
  // into, and useRef's value isn't available until after the first commit;
  // this triggers the extra render that makes it available. `empty:hidden`
  // below collapses the row to nothing when no chip actually portals in.
  const [summaryEl, setSummaryEl] = useState<HTMLDivElement | null>(null);

  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onShare();
  };

  // Per-type paginated fetchers used by the popovers. Each closure
  // captures the item id so the popover can request page after page
  // without ever loading the full list upfront.
  const fetchLikersPageFn = (offset: number) => fetchLikersPage(itemId, offset);
  const fetchCommentersPageFn = (offset: number, seen?: Set<string>) =>
    fetchCommentersPage(itemId, offset, undefined, seen);

  return (
    <div className="w-full mb-1">
      <div className="grid grid-cols-4 w-full gap-1">
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
            summaryPortalTarget={summaryEl}
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
            summaryPortalTarget={summaryEl}
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
            summaryPortalTarget={summaryEl}
          />
        </div>
      </div>

      {/* Trello B2: like/comment/interest counters land here instead of
          squeezed inline next to their toggle labels -- full width, real
          gaps, nothing else nearby to collide with. empty:hidden collapses
          this to zero height when every count is 0 (nothing portals in). */}
      <div
        ref={setSummaryEl}
        className="empty:hidden flex flex-wrap items-center justify-center gap-x-2 gap-y-1 mt-1 px-2"
      />
    </div>
  );
}
