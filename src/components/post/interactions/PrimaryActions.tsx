
import { User } from "@/hooks/item/useItemInteractions";
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";
import { ShareButton } from "./button/ShareButton";
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  
  console.log("PrimaryActions rendering for item:", itemId, "with props:", { 
    isLiked, showComments, showInterest, likesCount, commentsCount, interestsCount 
  });
  
  const handleShareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onShare();
  };
  
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
          isOwner={isOwner}
          labelPassive={t('interactions.interest')}
          labelActive={t('interactions.interested')}
          iconPassive="star"
          iconActive="star"
          itemId={itemId}
        />
      </div>
    </div>
  );
}
