import { Flag, ThumbsUp, MessageCircle, Mail, MoreVertical, Share2, Bookmark } from "lucide-react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
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
  onMessage: () => void;
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
  const { toast } = useToast();

  const primaryActions = [
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
      onClick: onMessage,
      component: Link,
      to: `/messages/new/${postedBy.name}`,
    },
  ];

  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-gray-100">
      <div className="flex items-center space-x-4">
        <PostActions actions={primaryActions} />
      </div>

      <div className="flex items-center space-x-3">
        <Button
          variant={showInterest ? "default" : "secondary"}
          size="sm"
          onClick={onShowInterest}
          className={`font-semibold ${
            showInterest ? "bg-accent hover:bg-accent-hover text-accent-foreground" : ""
          }`}
        >
          <ThumbsUp size={16} className="mr-2" />
          {showInterest ? "Interested" : "Show Interest"}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={onBookmarkToggle}>
              <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
              {isBookmarked ? "Saved" : "Save item"}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </DropdownMenuItem>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                  <Flag className="mr-2 h-4 w-4" />
                  Report
                </DropdownMenuItem>
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
                  <AlertDialogAction onClick={onReport}>Report</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}