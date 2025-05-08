
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useItemCard } from "@/hooks/useItemCard";

interface UseItemCardContainerProps {
  id: number;
  postedBy: {
    id: string;
    name: string;
    avatar?: string; // Make avatar optional to match our updated types
  };
}

export const useItemCardContainer = ({ id, postedBy }: UseItemCardContainerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get user interactions data from the hook
  const itemCardData = useItemCard(id.toString());
  
  // Extract only what we need from itemCardData
  const {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage: itemCardHandleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  } = itemCardData;

  // Create a wrapper function that adapts the signature
  const handleMessage = (e: React.MouseEvent) => {
    if (postedBy.id) {
      itemCardHandleMessage(e, id.toString(), postedBy.id);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this post?")) {
      return;
    }

    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Post deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: "Error",
        description: "Failed to delete post. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  return {
    // State
    isDeleting,
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    setComments,
    // Actions
    handleDelete,
    handleEdit,
    handleMessage,
    handleLike,
    handleCommentToggle,
    handleBookmark,
    handleShowInterest,
    handleShare,
    handleReport,
  };
};

