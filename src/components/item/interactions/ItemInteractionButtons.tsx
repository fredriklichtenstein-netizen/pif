
import { PrimaryActions } from "@/components/post/interactions/PrimaryActions";
import type { User } from "@/hooks/item/useItemInteractions";

interface ItemInteractionButtonsProps {
  id: string;
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  currentUserId?: string;
  hasCommented: boolean;
  commentsCount: number;
  likesCount: number;
  interestsCount: number;
  likers: User[];
  interestedUsers: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onShare: () => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
}

export const ItemInteractionButtons = ({
  id,
  isLiked,
  showComments,
  showInterest,
  isOwner,
  currentUserId,
  hasCommented,
  commentsCount,
  likesCount,
  interestsCount,
  likers,
  interestedUsers,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onShare,
  fetchLikers,
  fetchInterestedUsers,
}: ItemInteractionButtonsProps) => {
  return (
    <PrimaryActions
      isLiked={isLiked}
      showComments={showComments}
      showInterest={showInterest}
      isOwner={isOwner}
      itemId={id}
      hasCommented={hasCommented}
      currentUserId={currentUserId}
      commentsCount={commentsCount}
      likesCount={likesCount}
      interestsCount={interestsCount}
      likers={likers}
      interestedUsers={interestedUsers}
      onLikeToggle={onLikeToggle}
      onCommentToggle={onCommentToggle}
      onShowInterest={onShowInterest}
      onShare={onShare}
      fetchLikers={fetchLikers}
      fetchInterestedUsers={fetchInterestedUsers}
    />
  );
};
