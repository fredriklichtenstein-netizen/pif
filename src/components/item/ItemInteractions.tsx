import { PrimaryActions } from "../post/interactions/PrimaryActions";
import { useToast } from "@/hooks/use-toast";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { ItemInteractionsProps } from "./types";
import type { User } from "@/hooks/item/useItemInteractions";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useNavigate } from "react-router-dom";

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const currentUserId = user?.id || "";

  const handleAction = async (action: () => void, requiresAuth: boolean = true) => {
    if (requiresAuth && !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to perform this action",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    try {
      await action();
    } catch (error) {
      console.error('Action failed:', error);
      toast({
        title: "Action failed",
        description: error instanceof Error ? error.message : "Unable to complete action",
        variant: "destructive",
      });
    }
  };

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
          onLikeToggle={() => handleAction(onLikeToggle)}
          onCommentToggle={() => handleAction(onCommentToggle, false)}
          onShowInterest={() => handleAction(onShowInterest)}
          onShare={onShare}
          fetchLikers={async () => likers}
          fetchInterestedUsers={async () => interestedUsers}
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
