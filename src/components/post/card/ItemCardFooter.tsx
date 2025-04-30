
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
  onLike: () => void;
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
  onLike,
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
          commentsCount={commentsCount}
          likesCount={likesCount}
          interestsCount={interestsCount}
          likers={likers}
          interestedUsers={interestedUsers}
          onLike={onLike}
          onCommentToggle={onCommentToggle}
          onShowInterest={onShowInterest}
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
