import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { ItemHeader } from "./post/ItemHeader";
import { ItemImage } from "./post/ItemImage";
import { ItemInteractions } from "./post/ItemInteractions";
import { CommentSection } from "./post/CommentSection";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
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
  const navigate = useNavigate();

  const checkAuth = async (action: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast({
        title: "Authentication required",
        description: `Please sign in to ${action}`,
        action: {
          label: "Sign in",
          onClick: () => navigate("/auth"),
        },
      });
      return false;
    }
    return true;
  };

  const handleShowInterest = async () => {
    if (!await checkAuth("show interest")) return;
    
    setShowInterest(!showInterest);
    toast({
      title: showInterest ? "Interest removed" : "Interest shown!",
      description: showInterest 
        ? "You will no longer receive updates about this item" 
        : "The owner will be notified of your interest",
    });
  };

  const handleAddComment = async (text: string) => {
    if (!await checkAuth("add a comment")) return;

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

  const handleLikeComment = async (commentId: string) => {
    if (!await checkAuth("like a comment")) return;

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

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!await checkAuth("edit a comment")) return;

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

  const handleDeleteComment = async (commentId: string) => {
    if (!await checkAuth("delete a comment")) return;

    setComments(comments.filter(comment => comment.id !== commentId));
    toast({
      title: "Comment deleted",
      description: "Your comment has been removed",
    });
  };

  const handleReplyToComment = async (commentId: string, text: string) => {
    if (!await checkAuth("reply to a comment")) return;

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

  const handleReportComment = async (commentId: string) => {
    if (!await checkAuth("report a comment")) return;

    toast({
      title: "Comment reported",
      description: "Thank you for helping keep our community safe. We'll review this comment.",
    });
  };

  const handleReact = async (type: string) => {
    if (!await checkAuth("react to this item")) return;

    toast({
      title: `Reacted with ${type}`,
      description: "Your reaction has been recorded",
    });
  };

  const handleBookmark = async () => {
    if (!await checkAuth("bookmark this item")) return;

    setIsBookmarked(!isBookmarked);
    toast({
      title: isBookmarked ? "Removed from saved items" : "Saved to your items",
      description: isBookmarked 
        ? "This item has been removed from your saved items" 
        : "You can find this item in your saved items",
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
      <ItemImage image={image} title={title} />
      <div className="p-4">
        <ItemHeader
          category={category}
          condition={condition}
          location={location}
          title={title}
          description={description}
          postedBy={postedBy}
        />
        <div className="mt-4">
          <ItemInteractions
            id={id}
            postedBy={postedBy}
            isLiked={isLiked}
            showComments={showComments}
            isBookmarked={isBookmarked}
            showInterest={showInterest}
            onLikeToggle={() => setIsLiked(!isLiked)}
            onCommentToggle={() => setShowComments(!showComments)}
            onShowInterest={handleShowInterest}
            onBookmarkToggle={handleBookmark}
            onReact={handleReact}
          />
        </div>
        <CommentSection
          comments={comments}
          showComments={showComments}
          onAddComment={handleAddComment}
          onLikeComment={handleLikeComment}
          onDeleteComment={handleDeleteComment}
          onEditComment={handleEditComment}
          onReplyToComment={handleReplyToComment}
          onReportComment={handleReportComment}
        />
      </div>
    </div>
  );
}