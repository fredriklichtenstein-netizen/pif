
import { LikeButton } from "./interactions/LikeButton";
import { CommentButton } from "./interactions/CommentButton";
import { MessageButton } from "./interactions/MessageButton";
import { InterestButton } from "./interactions/InterestButton";
import { ItemOwnerActions } from "./interactions/ItemOwnerActions";
import { ConversationHandler } from "./interactions/ConversationHandler";

type User = {
  id: string;
  name: string;
  avatar?: string;
};

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
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
  commenters?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
  onShare: () => void;
  onReport: () => void;
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
  commenters = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
}: ItemInteractionsProps) {
  return (
    <div className="flex flex-col space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <LikeButton 
          isLiked={isLiked} 
          onLikeToggle={onLikeToggle} 
          likesCount={likesCount}
          disabled={isOwner}
        />
        
        <CommentButton 
          onCommentToggle={onCommentToggle} 
          commentsCount={commentsCount}
        />
        
        {!isOwner && (
          <ConversationHandler itemId={id} receiverId={postedBy.id}>
            {({ handleClick, isLoading }) => (
              <MessageButton onClick={handleClick} disabled={isLoading} />
            )}
          </ConversationHandler>
        )}
        
        {!isOwner && (
          <div className="ml-auto">
            <InterestButton 
              showInterest={showInterest} 
              onShowInterest={onShowInterest} 
              interestsCount={interestsCount}
            />
          </div>
        )}
      </div>
    </div>
  );
}
