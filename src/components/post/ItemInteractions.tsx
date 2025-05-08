
import { InteractionCounts } from "./interactions/InteractionCounts";
import { ActionButtons } from "./interactions/ActionButtons";
import { InteractionsLoading } from "./interactions/InteractionsLoading";
import { LazyCommentsSection } from "../comments/LazyCommentsSection";
import type { User } from "@/hooks/item/useItemInteractions";
import { useItemSharing } from "@/hooks/item/useItemSharing";

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
    avatar?: string; // Make avatar optional to match our updated types
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
  onEdit?: () => void;
  onDelete?: () => void;
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
  onEdit,
  onDelete,
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
  
  const { handleShare } = useItemSharing(id);
  
  // Create a share handler that uses the useItemSharing hook
  const handleShareAction = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log(`Post.ItemInteractions: Share action triggered for item: ${id}`);
    handleShare(e);
  };
  
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
        itemId={id}
        commentsCount={commentsCount}
        likesCount={likesCount}
        interestsCount={interestsCount}
        likers={likers}
        interestedUsers={interestedUsers}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
        onShare={handleShareAction}
        fetchLikers={getInterestedUsers ? () => Promise.resolve(likers) : undefined}
        fetchInterestedUsers={getInterestedUsers ? () => Promise.resolve(interestedUsers) : undefined}
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
