import { useToast } from "@/hooks/use-toast";
import { PrimaryActions } from "./interactions/PrimaryActions";
import { SecondaryActions } from "./interactions/SecondaryActions";
import { InterestButton } from "./interactions/InterestButton";

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    name: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
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
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
}: ItemInteractionsProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
      <PrimaryActions
        isLiked={isLiked}
        showComments={showComments}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onMessage={onMessage}
      />

      <div className="flex items-center space-x-3">
        <InterestButton 
          showInterest={showInterest} 
          onShowInterest={onShowInterest} 
        />
        <SecondaryActions
          isBookmarked={isBookmarked}
          onBookmarkToggle={onBookmarkToggle}
          onShare={onShare}
          onReport={onReport}
        />
      </div>
    </div>
  );
}