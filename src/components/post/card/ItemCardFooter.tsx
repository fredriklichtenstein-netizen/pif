
import { ItemCardActions } from "../ItemCardActions";
import { CommentSection } from "../CommentSection";
import { User } from "@/hooks/item/useItemInteractions";

interface ItemCardFooterProps {
  id: string;
  isLiked: boolean;
  showInterest: boolean;
  isOwner: boolean;
  showComments: boolean;
  commentsCount: number;
  likesCount: number;
  interestsCount: number;
  likers: User[];
  interestedUsers: User[];
  comments: any[];
  setComments: (comments: any[]) => void;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function ItemCardFooter({
  id,
  isLiked,
  showInterest,
  isOwner,
  showComments,
  commentsCount,
  likesCount,
  interestsCount,
  likers,
  interestedUsers,
  comments,
  setComments,
  onLikeToggle,
  onCommentToggle,
  onShowInterest
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
          likesCount={likesCount}
          interestsCount={interestsCount}
          likers={likers}
          interestedUsers={interestedUsers}
          onLikeToggle={onLikeToggle}
          onCommentToggle={onCommentToggle}
          onShowInterest={onShowInterest}
          postedBy={{id: "", name: "", avatar: ""}}
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
          commenters={[]}
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
