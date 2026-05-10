
import { PrimaryActions } from "@/components/post/interactions/PrimaryActions";
import type { User } from "@/hooks/item/useItemInteractions";
import type { ItemType } from "@/components/item/types";

interface ItemInteractionButtonsProps {
  id: string;
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  itemType?: ItemType;
  itemTitle?: string;
  currentUserId?: string;
  itemOwnerId?: string;
  hasCommented: boolean;
  commentsCount: number;
  likesCount: number;
  interestsCount: number;
  likers: User[];
  interestedUsers: User[];
  commenters?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: (note?: string) => void;
  onShare: () => void;
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
  fetchCommenters?: () => Promise<User[]>;
}

export const ItemInteractionButtons = ({
  id,
  isLiked,
  showComments,
  showInterest,
  isOwner,
  itemType,
  itemTitle,
  currentUserId,
  itemOwnerId,
  hasCommented,
  commentsCount,
  likesCount,
  interestsCount,
  likers,
  interestedUsers,
  commenters,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onShare,
  fetchLikers,
  fetchInterestedUsers,
  fetchCommenters,
}: ItemInteractionButtonsProps) => {
  return (
    <PrimaryActions
      isLiked={isLiked}
      showComments={showComments}
      showInterest={showInterest}
      isOwner={isOwner}
      itemId={id}
      itemOwnerId={itemOwnerId}
      itemType={itemType}
      itemTitle={itemTitle}
      hasCommented={hasCommented}
      currentUserId={currentUserId}
      commentsCount={commentsCount}
      likesCount={likesCount}
      interestsCount={interestsCount}
      likers={likers}
      interestedUsers={interestedUsers}
      commenters={commenters}
      onLikeToggle={onLikeToggle}
      onCommentToggle={onCommentToggle}
      onShowInterest={onShowInterest}
      onShare={onShare}
      fetchLikers={fetchLikers}
      fetchInterestedUsers={fetchInterestedUsers}
      fetchCommenters={fetchCommenters}
    />
  );
};
