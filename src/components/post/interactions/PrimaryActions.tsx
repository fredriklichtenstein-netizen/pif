
import { useState } from "react";
import { User } from "@/hooks/item/useItemInteractions";
import { InteractionButtonWithPopup } from "./InteractionButtonWithPopup";

interface PrimaryActionsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  itemId: string;
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
  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  interestedUsers = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  fetchLikers,
  fetchInterestedUsers
}: PrimaryActionsProps) {
  return (
    <div className="flex justify-between w-full pt-1 gap-2">
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
        itemId={itemId}
        onClick={onCommentToggle}
        labelPassive="Comment"
        labelActive="Commented"
        iconPassive="message-square"
        iconActive="message-square"
        isOwner={false} // Comment always enabled
      />
      <InteractionButtonWithPopup
        type="interest"
        isActive={showInterest}
        count={interestsCount}
        users={interestedUsers}
        onClick={onShowInterest}
        onCounterClick={fetchInterestedUsers}
        isOwner={isOwner}
        labelPassive="Show Interest"
        labelActive="Interested"
        iconPassive="star"
        iconActive="star"
        itemId={itemId}
      />
    </div>
  );
}
