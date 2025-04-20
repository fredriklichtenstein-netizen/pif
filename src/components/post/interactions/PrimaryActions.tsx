
import { ThumbsUp, MessageCircle, Heart } from "lucide-react";
import { PostActions } from "../PostActions";
import type { PostAction } from "@/types/comment";
import { Separator } from "@/components/ui/separator";

interface PrimaryActionsProps {
  isLiked: boolean;
  showComments: boolean;
  isOwner: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
}

export function PrimaryActions({
  isLiked,
  showComments,
  isOwner,
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
}: PrimaryActionsProps) {
  const actions: PostAction[] = [
    {
      icon: <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} />,
      label: "Like",
      labelText: "Like",
      onClick: onLikeToggle,
      active: isLiked,
      disabled: isOwner,
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Comment",
      labelText: "Comment",
      onClick: onCommentToggle,
      active: showComments,
    },
    {
      icon: <Heart size={20} />,
      label: "Interest",
      labelText: "Show Interest",
      onClick: onShowInterest,
      disabled: isOwner,
    },
  ];

  return (
    <div className="flex flex-col w-full">
      <Separator className="my-2" />
      <div className="flex items-center space-x-4">
        <PostActions actions={actions} />
      </div>
    </div>
  );
}
