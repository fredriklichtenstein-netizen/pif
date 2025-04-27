
import { Separator } from "@/components/ui/separator";
import { useMemo } from "react";
import { PrimaryActions } from "./PrimaryActions";
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
  onShare: () => void;  // Added this prop to match PrimaryActions requirements
  fetchLikers?: () => Promise<User[]>;
  fetchInterestedUsers?: () => Promise<User[]>;
}

export function ActionButtons({
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
  onShare,  // Added this prop to match PrimaryActions requirements
  fetchLikers,
  fetchInterestedUsers,
}: ActionButtonsProps) {
  return (
    <div className="w-full">
      <PrimaryActions
        isLiked={isLiked}
        showComments={showComments}
        showInterest={showInterest}
        isOwner={isOwner}
        itemId={itemId}
        commentsCount={commentsCount}
        likesCount={likesCount}
        interestsCount={interestsCount}
        likers={likers}
        interestedUsers={interestedUsers}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
        onShare={onShare}  // Pass the onShare prop to PrimaryActions
        fetchLikers={fetchLikers}
        fetchInterestedUsers={fetchInterestedUsers}
      />
    </div>
  );
}
