import { InteractionCounts } from "../post/interactions/InteractionCounts";
import { PrimaryActions } from "../post/interactions/PrimaryActions";
import { SecondaryActions } from "../post/interactions/SecondaryActions";
import { InteractionsLoading } from "../post/interactions/InteractionsLoading";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { ItemInteractionsProps } from "./types";
import { Separator } from "@/components/ui/separator";

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
  onEdit,
  onDelete,
  interactionsLoading = false,
  isLoadingInterested = false,
  interestedError = null,
  getInterestedUsers,
  isRealtimeSubscribed = false
}: ItemInteractionsProps) {
  if (interactionsLoading) {
    return <InteractionsLoading />;
  }
  
  return (
    <div className="flex flex-col space-y-1">
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
      
      <PrimaryActions 
        isLiked={isLiked}
        showComments={showComments}
        isOwner={isOwner}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
      />

      <Separator className="my-1" />
      
      <SecondaryActions 
        isBookmarked={isBookmarked}
        isOwner={isOwner}
        onBookmarkToggle={onBookmarkToggle}
        onShare={onShare}
        onReport={onReport}
        onEdit={onEdit}
        onDelete={onDelete}
      />
    </div>
  );
}
