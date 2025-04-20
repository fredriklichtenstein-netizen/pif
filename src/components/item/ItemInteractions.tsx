
import { InteractionCounts } from "../post/interactions/InteractionCounts";
import { PrimaryActions } from "../post/interactions/PrimaryActions";
import { SecondaryActions } from "../post/interactions/SecondaryActions";
import { InteractionsLoading } from "../post/interactions/InteractionsLoading";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { ItemInteractionsProps } from "./types";
import { Separator } from "@/components/ui/separator";
import type { User } from "@/hooks/item/useItemInteractions";
import { useGlobalAuth } from "@/hooks/useGlobalAuth"; // <-- Make sure to import and use this for current user

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
  // Get the actual current user ID from the global auth store
  const { user } = useGlobalAuth();
  const currentUserId = user?.id || "";

  if (interactionsLoading) {
    return <InteractionsLoading />;
  }

  // "Active" for comment action is only if current user has commented on the post!
  const hasCommented =
    commenters && currentUserId
      ? commenters.some((user) => user.id === currentUserId)
      : false;

  // Wrap fetchers so the signatures are correct for PrimaryActions (Promise<User[]>)
  const fetchLikersWrapper = async (): Promise<User[]> => {
    // If a fetch function is available, call it, otherwise just return current likers
    if (typeof getInterestedUsers === 'function') {
      await getInterestedUsers(); // Side effect, e.g., refresh all users
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

