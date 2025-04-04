
import { InteractionCounts } from "./interactions/InteractionCounts";
import { ActionButtons } from "./interactions/ActionButtons";
import { InteractionsLoading } from "./interactions/InteractionsLoading";
import type { User } from "@/hooks/item/useItemInteractions";

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner?: boolean;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  interestedUsers?: User[];
  commenters?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
  onShare: () => void;
  onReport: () => void;
  interactionsLoading?: boolean;
  isLoadingInterested?: boolean;
  interestedError?: Error | null;
  getInterestedUsers?: () => void;
  isRealtimeSubscribed?: boolean;
}

export function ItemInteractions({
  id,
  postedBy,
  isLiked,
  showComments,
  isBookmarked,
  showInterest,
  isOwner = false,
  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  interestedUsers = [],
  commenters = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
  interactionsLoading = false,
  isLoadingInterested = false,
  interestedError = null,
  getInterestedUsers,
  isRealtimeSubscribed = false
}: ItemInteractionsProps) {
  // If interactions are loading, show skeleton placeholders
  if (interactionsLoading) {
    return <InteractionsLoading />;
  }
  
  return (
    <div className="flex flex-col space-y-2">
      <InteractionCounts 
        likesCount={likesCount}
        commentsCount={commentsCount}
        interestsCount={interestsCount}
        likers={likers}
        interestedUsers={interestedUsers}
        onCommentToggle={onCommentToggle}
        isLoadingInterested={isLoadingInterested}
        interestedError={interestedError}
        getInterestedUsers={getInterestedUsers}
      />
      
      <ActionButtons 
        isLiked={isLiked}
        showComments={showComments}
        showInterest={showInterest}
        isOwner={isOwner}
        isRealtimeSubscribed={isRealtimeSubscribed}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
      />
    </div>
  );
}
