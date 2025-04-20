
import { Separator } from "@/components/ui/separator";
import { PrimaryActions } from "./PrimaryActions";

interface ActionButtonsProps {
  isLiked: boolean;
  showComments: boolean;
  showInterest: boolean;
  isOwner: boolean;
  isRealtimeSubscribed?: boolean;
  itemId: string;
  commentsCount?: number;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function ActionButtons({
  isLiked,
  showComments,
  isOwner,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
}: ActionButtonsProps) {
  return (
    <div className="w-full">
      <PrimaryActions
        isLiked={isLiked}
        showComments={showComments}
        isOwner={isOwner}
        onLikeToggle={onLikeToggle}
        onCommentToggle={onCommentToggle}
        onShowInterest={onShowInterest}
      />
    </div>
  );
}
