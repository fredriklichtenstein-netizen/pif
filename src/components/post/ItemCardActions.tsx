
import { ItemInteractions } from "./ItemInteractions";
import { CommentSection } from "@/components/post/CommentSection";
import { useItemSharing } from "@/hooks/item/useItemSharing";
import type { User } from "@/hooks/item/useItemInteractions";

interface ItemCardActionsProps {
  id: string | number;
  postedBy: {
    id?: string;
    name: string;
    avatar: string;
  };
  isOwner: boolean;
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  commentsCount: number;
  likesCount: number;
  interestsCount: number;
  likers: User[];
  interestedUsers: User[];
  commenters: User[];
  comments: any[];
  commentsLoading: boolean;
  commentsError: Error | null;
  interactionsLoading: boolean;
  isLoadingInterested: boolean;
  interestedError: Error | null;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: () => void;
  onShare: () => void;
  onReport: () => void;
  onEdit: () => void;
  onDelete: () => void;
  getInterestedUsers: () => void;
  setComments: (comments: any[]) => void;
  isRealtimeSubscribed: boolean;
}

export function ItemCardActions({
  id,
  postedBy,
  isOwner,
  isLiked,
  showComments,
  isBookmarked,
  showInterest,
  commentsCount,
  likesCount,
  interestsCount,
  likers,
  interestedUsers,
  commenters,
  comments,
  commentsLoading,
  commentsError,
  interactionsLoading,
  isLoadingInterested,
  interestedError,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
  onEdit,
  onDelete,
  getInterestedUsers,
  setComments,
  isRealtimeSubscribed
}: ItemCardActionsProps) {
  const stringId = String(id);
  const { handleShare, isSharing } = useItemSharing(stringId);
  
  return (
    <div className="space-y-2"> {/* Reduced spacing between elements */}
      <ItemInteractions
        id={stringId}
        postedBy={postedBy}
        isLiked={isLiked}
        showComments={showComments}
        isBookmarked={isBookmarked}
        showInterest={showInterest}
        isOwner={isOwner}
        commentsCount={commentsCount}
        likesCount={likesCount}
        interestsCount={interestsCount}
        likers={likers}
        interestedUsers={interestedUsers}
        commenters={commenters}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
        onBookmarkToggle={onBookmarkToggle}
        onMessage={onMessage}
        onShare={handleShare}
        onReport={onReport}
        onEdit={onEdit}
        onDelete={onDelete}
        interactionsLoading={interactionsLoading}
        isLoadingInterested={isLoadingInterested}
        interestedError={interestedError}
        getInterestedUsers={getInterestedUsers}
        isRealtimeSubscribed={isRealtimeSubscribed}
      />

      {showComments && (
        <CommentSection
          itemId={stringId}
          comments={comments}
          setComments={setComments}
          isLoading={commentsLoading}
          error={commentsError}
        />
      )}
    </div>
  );
}
