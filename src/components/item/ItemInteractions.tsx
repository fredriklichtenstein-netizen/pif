
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
  // Get the actual current user ID from the global auth store
  const { user } = useGlobalAuth();
  const currentUserId = user?.id || "";

  if (interactionsLoading) {
    return <InteractionsLoading />;
  }

  // "Active" for comment action is only if current user has commented on the post or replied to a comment!
  // Check both direct comments and replies in all comments
  // After deleting all comments/replies from this user, the active state should become false
  const hasCommented = Boolean(
    commenters &&
    currentUserId &&
    (
      // direct comments - add null check for author and author.id
      commenters.some(comment => comment.author && comment.author.id === currentUserId) ||
      // or any reply authored by currentUserId - add null checks for replies and reply.author
      commenters.some(comment =>
        comment.replies?.some(reply => reply.author && reply.author.id === currentUserId)
      )
    )
  );

  // Get the actual counts based on available data
  const actualLikeCount = likers.length || likesCount;
  const actualInterestCount = interestedUsers.length || interestsCount;

  // Render only primary and secondary actions without the old counters section
  return (
    <div className="flex flex-col space-y-3 pt-2"> {/* Increased spacing from space-y-1 to space-y-3 and padding top added */}
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

      {/* Lazy load comments section only when shown */}
      {showComments && (
        <LazyCommentsSection
          itemId={id}
          isVisible={showComments}
        />
      )}
    </div>
  );
}
