import { Flag, ThumbsUp, MessageCircle, Mail } from "lucide-react";
import { Button } from "../ui/button";
import { PostActions } from "./PostActions";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

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
  onReact: (type: string) => void;
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
  onReact,
}: ItemInteractionsProps) {
  const { toast } = useToast();

  const postActions = [
    {
      icon: <ThumbsUp size={20} fill={isLiked ? "currentColor" : "none"} />,
      label: "Like",
      onClick: onLikeToggle,
      active: isLiked,
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Comment",
      onClick: onCommentToggle,
      active: showComments,
    },
    {
      icon: <Mail size={20} />,
      label: "Message",
      onClick: () => null,
      component: Link,
      to: `/messages/new/${postedBy.name}`,
    },
  ];

  return (
    <div className="flex items-center justify-between">
      <PostActions
        actions={postActions}
        onReact={onReact}
        onBookmark={onBookmarkToggle}
        isBookmarked={isBookmarked}
      />
      <div className="flex items-center space-x-3">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Flag className="mr-2 h-4 w-4" />
              Report
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Report this item</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to report this item? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => {
                toast({
                  title: "Item reported",
                  description: "Thank you for helping keep our community safe. We'll review this item.",
                });
              }}>
                Report
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button
          variant={showInterest ? "default" : "outline"}
          size="sm"
          onClick={onShowInterest}
          className="ml-2"
        >
          <ThumbsUp size={16} className="mr-2" />
          {showInterest ? "Interested" : "Show Interest"}
        </Button>
      </div>
    </div>
  );
}
