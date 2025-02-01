import { Heart, MessageCircle, MapPin, ThumbsUp, Mail, Share2, Flag } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "./ui/button";
import { useToast } from "@/hooks/use-toast";
import { CommentInput } from "./comments/CommentInput";
import { CommentCard } from "./comments/CommentCard";
import { PostActions } from "./post/PostActions";
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
} from "./ui/alert-dialog";
import type { Comment } from "@/types/comment";

interface ItemCardProps {
  id: string;
  title: string;
  description: string;
  image: string;
  location: string;
  category: string;
  condition?: string;
  postedBy: {
    name: string;
    avatar: string;
  };
}

export function ItemCard({
  id,
  title,
  description,
  image,
  location,
  category,
  condition,
  postedBy,
}: ItemCardProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [showInterest, setShowInterest] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const { toast } = useToast();

  const handleShowInterest = () => {
    setShowInterest(!showInterest);
    toast({
      title: showInterest ? "Interest removed" : "Interest shown!",
      description: showInterest 
        ? "You will no longer receive updates about this item" 
        : "The owner will be notified of your interest",
    });
  };

  const handleAddComment = (text: string) => {
    const comment: Comment = {
      id: Date.now().toString(),
      text,
      author: {
        name: "Current User",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    setComments([comment, ...comments]);
  };

  const handleLikeComment = (commentId: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  const handleEditComment = (commentId: string, newText: string) => {
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return { ...comment, text: newText };
      }
      return comment;
    }));
    toast({
      title: "Comment updated",
      description: "Your comment has been edited successfully",
    });
  };

  const handleDeleteComment = (commentId: string) => {
    setComments(comments.filter(comment => comment.id !== commentId));
    toast({
      title: "Comment deleted",
      description: "Your comment has been removed",
    });
  };

  const handleReplyToComment = (commentId: string, text: string) => {
    const reply: Comment = {
      id: Date.now().toString(),
      text,
      author: {
        name: "Current User",
        avatar: "https://i.pravatar.cc/150?img=3",
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [reply, ...comment.replies],
        };
      }
      return comment;
    }));
  };

  const handleReportComment = (commentId: string) => {
    toast({
      title: "Comment reported",
      description: "Thank you for helping keep our community safe. We'll review this comment.",
    });
  };

  const handleReact = (type: string) => {
    toast({
      title: `Reacted with ${type}`,
      description: "Your reaction has been recorded",
    });
  };

  const handleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from saved items" : "Saved to your items",
      description: isBookmarked 
        ? "This item has been removed from your saved items" 
        : "You can find this item in your saved items",
    });
  };

  const postActions = [
    {
      icon: <Heart size={20} fill={isLiked ? "currentColor" : "none"} />,
      label: "Like",
      onClick: () => setIsLiked(!isLiked),
      active: isLiked,
    },
    {
      icon: <MessageCircle size={20} />,
      label: "Comment",
      onClick: () => setShowComments(!showComments),
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
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <img
        src={image}
        alt={title}
        className="w-full h-48 object-cover"
      />
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="space-x-2">
            <span className="text-sm font-medium text-secondary">{category}</span>
            {condition && (
              <span className="text-sm text-gray-500">• {condition}</span>
            )}
          </div>
          <div className="flex items-center text-gray-500 text-sm">
            <MapPin size={14} className="mr-1" />
            <span>{location}</span>
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        <p className="text-gray-600 text-sm mb-3">{description}</p>
        <div className="flex items-center justify-between">
          <Link
            to={`/profile/${postedBy.name}`}
            className="flex items-center"
          >
            <img
              src={postedBy.avatar}
              alt={postedBy.name}
              className="w-6 h-6 rounded-full mr-2"
            />
            <span className="text-sm text-gray-600">{postedBy.name}</span>
          </Link>
          <div className="flex items-center space-x-3">
            <PostActions
              actions={postActions}
              onReact={handleReact}
              onBookmark={handleBookmark}
              isBookmarked={isBookmarked}
            />
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
              onClick={handleShowInterest}
              className="ml-2"
            >
              <ThumbsUp size={16} className="mr-2" />
              {showInterest ? "Interested" : "Show Interest"}
            </Button>
          </div>
        </div>

        {showComments && (
          <div className="mt-4 space-y-4">
            <CommentInput onSubmit={handleAddComment} />
            <div className="space-y-4">
              {comments.map((comment) => (
                <CommentCard
                  key={comment.id}
                  comment={comment}
                  onLike={handleLikeComment}
                  onDelete={handleDeleteComment}
                  onEdit={handleEditComment}
                  onReply={handleReplyToComment}
                  onReport={handleReportComment}
                  currentUser="Current User"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}