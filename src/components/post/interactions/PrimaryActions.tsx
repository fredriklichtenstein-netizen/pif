
import { ThumbsUp, MessageCircle, Mail, Heart } from "lucide-react";
import { PostActions } from "../PostActions";
import type { PostAction } from "@/types/comment";

interface PrimaryActionsProps {
  isLiked: boolean;
  showComments: boolean;
  isOwner: boolean;
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
}

export function PrimaryActions({
  isLiked,
  showComments,
  isOwner,
  onLikeToggle,
  onCommentToggle,
  onMessage,
}: PrimaryActionsProps) {
  const actions: PostAction[] = [
    {
      icon: <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} />,
      label: "Like",
      onClick: onLikeToggle,
      active: isLiked,
      disabled: isOwner,
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Comment",
      onClick: onCommentToggle,
      active: showComments,
    },
    {
      icon: <Heart size={20} />,
      label: "Interest",
      onClick: onMessage,
      disabled: isOwner,
    },
  ];

  return (
    <div className="flex items-center space-x-4">
      <PostActions actions={actions} />
    </div>
  );
}
