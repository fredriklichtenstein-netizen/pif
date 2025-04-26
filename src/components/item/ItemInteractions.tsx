
import { PrimaryActions } from "../post/interactions/PrimaryActions";
import { SecondaryActions } from "../post/interactions/SecondaryActions";
import { InteractionsLoading } from "../post/interactions/InteractionsLoading";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { ItemInteractionsProps } from "./types";
import type { User } from "@/hooks/item/useItemInteractions";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

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
  const { user } = useGlobalAuth();
  const currentUserId = user?.id || "";

  if (interactionsLoading) {
    return <InteractionsLoading />;
  }

  const hasCommented = Boolean(
    commenters &&
    currentUserId &&
    (
      commenters.some(comment => comment.author && comment.author.id === currentUserId) ||
      commenters.some(comment =>
        comment.replies?.some(reply => reply.author && reply.author.id === currentUserId)
      )
    )
  );

  const actualLikeCount = likers.length || likesCount;
  const actualInterestCount = interestedUsers.length || interestsCount;

  return (
    <div className="flex flex-col space-y-3 pt-2">
      <div className="flex flex-col gap-3">
        <PrimaryActions 
          isLiked={isLiked}
          showComments={showComments}
          showInterest={showInterest}
          isOwner={isOwner}
          itemId={id}
          hasCommented={hasCommented}
          currentUserId={currentUserId}
          commentsCount={commentsCount}
          likesCount={actualLikeCount}
          interestsCount={actualInterestCount}
          likers={likers}
          interestedUsers={interestedUsers}
          onLikeToggle={onLikeToggle}
          onCommentToggle={onCommentToggle}
          onShowInterest={onShowInterest}
          fetchLikers={async () => likers}
          fetchInterestedUsers={async () => interestedUsers}
        />
        
        <SecondaryActions 
          isBookmarked={isBookmarked}
          isOwner={isOwner}
          onBookmarkToggle={onBookmarkToggle}
          onReport={onReport}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      </div>

      {showComments && (
        <LazyCommentsSection
          itemId={id}
          isVisible={showComments}
        />
      )}
    </div>
  );
}
