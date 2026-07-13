
import { ItemCardActions } from "../ItemCardActions";
import { CommentSection } from "../CommentSection";
import { User } from "@/hooks/item/useItemInteractions";
import type { ItemType } from "@/components/item/types";

interface ItemCardFooterProps {
  id: string;
  isLiked: boolean;
  showInterest: boolean;
  isOwner: boolean;
  showComments: boolean;
  commentsCount: number;
  hasCommented?: boolean;
  commenters?: User[];
  likesCount: number;
  interestsCount: number;
  likers: User[];
  interestedUsers: User[];
  comments: any[];
  setComments: (comments: any[]) => void;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  itemType?: ItemType;
  itemTitle?: string;
}


export function ItemCardFooter({
  id,
  isLiked,
  showInterest,
  isOwner,
  showComments,
  commentsCount,
  hasCommented = false,
  commenters = [],
  likesCount,
  interestsCount,
  likers,
  interestedUsers,
  comments,
  setComments,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  itemType,
  itemTitle

}: ItemCardFooterProps) {
  return (
    <>
      <div className="mt-4">
        <ItemCardActions
          id={id}
          isLiked={isLiked}
          showInterest={showInterest}
          isOwner={isOwner}
          showComments={showComments}
          commentsCount={commentsCount}
          hasCommented={hasCommented}
          likesCount={likesCount}
          interestsCount={interestsCount}
          likers={likers}
          interestedUsers={interestedUsers}
          onLikeToggle={onLikeToggle}
          onCommentToggle={onCommentToggle}
          onShowInterest={onShowInterest}
          itemType={itemType}
          itemTitle={itemTitle}

          postedBy={{id: "", name: "", avatar: undefined}}
          isBookmarked={false}
          onBookmarkToggle={() => {}}
          onMessage={() => {}}
          onShare={() => {}}
          onReport={() => {}}
          onEdit={() => {}}
          onDelete={() => {}}
          getInterestedUsers={() => {}}
          setComments={() => {}}
          comments={[]}
          commenters={commenters}
          commentsLoading={false}
          commentsError={null}
          interactionsLoading={false}
          isLoadingInterested={false}
          interestedError={null}
          isRealtimeSubscribed={false}
        />
      </div>
      
      {showComments && (
        <CommentSection
          itemId={id}
          comments={comments}
          setComments={setComments}
        />
      )}
    </>
  );
}
