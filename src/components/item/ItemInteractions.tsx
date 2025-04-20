
import { InteractionCounts } from "../post/interactions/InteractionCounts";
import { PrimaryActions } from "../post/interactions/PrimaryActions";
import { SecondaryActions } from "../post/interactions/SecondaryActions";
import { InteractionsLoading } from "../post/interactions/InteractionsLoading";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { ItemInteractionsProps } from "./types";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/hooks/item/useItemInteractions";

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
  
  // Create Promise-returning wrapper functions for the fetch methods
  const fetchLikersWrapper = async (): Promise<User[]> => {
    if (typeof getInterestedUsers === 'function') {
      await getInterestedUsers();
    }
    return likers || [];
  };
  
  const fetchInterestedUsersWrapper = async (): Promise<User[]> => {
    if (typeof getInterestedUsers === 'function') {
      await getInterestedUsers();
    }
    return interestedUsers || [];
  };
  
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
        showInterest={showInterest}
        isOwner={isOwner}
        itemId={id}
        commentsCount={commentsCount}
        likesCount={likesCount}
        interestsCount={interestsCount}
        likers={likers}
        interestedUsers={interestedUsers}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
        fetchLikers={fetchLikersWrapper}
        fetchInterestedUsers={fetchInterestedUsersWrapper}
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
