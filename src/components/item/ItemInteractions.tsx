
import { PrimaryActions } from "../post/interactions/PrimaryActions";
import { useToast } from "@/hooks/use-toast";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { ItemInteractionsProps } from "./types";
import type { User } from "@/hooks/item/useItemInteractions";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useNavigate } from "react-router-dom";
import { useItemSharing } from "@/hooks/item/useItemSharing";

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
  const { handleShare } = useItemSharing(id);
  
  console.log("ItemInteractions rendering for item:", id, "with props:", { 
    isLiked, showComments, showInterest, commentsCount, likesCount, interestsCount 
  });

  const handleAction = async (action: () => void, requiresAuth: boolean = true) => {
    console.log("handleAction called, requiresAuth:", requiresAuth, "user:", !!user);
    
    if (requiresAuth && !user) {
      console.log("Authentication required but no user is logged in");
      toast({
        title: "Authentication required",
        description: "Please sign in to perform this action",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }
    
    try {
      console.log("Executing action");
      await action();
      console.log("Action completed successfully");
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

  // Handle share function using the imported hook
  const handleShareAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("Share action triggered for item:", id);
    handleShare(e);
  };

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
          onShare={handleShareAction}
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
