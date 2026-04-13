
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useItemSharing } from "@/hooks/item/useItemSharing";
import { ItemInteractionButtons } from "./interactions/ItemInteractionButtons";
import { ActionHandler } from "./interactions/ActionHandler";
import { hasUserCommented } from "./interactions/CommentHelper";
import type { ItemInteractionsProps } from "./types";

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
  const { handleShare } = useItemSharing(id);
  // Check if current user has commented
  const userHasCommented = hasUserCommented(commenters, currentUserId);

  // Calculate actual counts in case likers array has more precise data
  const actualLikeCount = likers.length || likesCount;
  const actualInterestCount = interestedUsers.length || interestsCount;

  // Wrapper for handleShare that doesn't require an event parameter
  const handleShareAction = () => {
    handleShare();
  };

  return (
    <div className="flex flex-col space-y-3">
      <ActionHandler>
        {(handleAction) => (
          <div className="flex flex-col">
            <ItemInteractionButtons
              id={id}
              isLiked={isLiked}
              showComments={showComments}
              showInterest={showInterest}
              isOwner={isOwner}
              currentUserId={currentUserId}
              hasCommented={userHasCommented}
              commentsCount={commentsCount}
              likesCount={actualLikeCount}
              interestsCount={actualInterestCount}
              likers={likers}
              interestedUsers={interestedUsers}
              onLikeToggle={() => handleAction(onLikeToggle)}
              onCommentToggle={() => handleAction(onCommentToggle, false)}
              onShowInterest={() => handleAction(onShowInterest)}
              onShare={handleShareAction}
              fetchLikers={async () => likers}
              fetchInterestedUsers={async () => interestedUsers}
            />
          </div>
        )}
      </ActionHandler>

    </div>
  );
}
