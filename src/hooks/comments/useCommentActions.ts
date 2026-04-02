
import { useState, useEffect } from "react";
import { Comment } from "@/types/comment";
import { useCommentCreate } from "./useCommentCreate";
import { useCommentDelete } from "./useCommentDelete";
import { useCommentEdit } from "./useCommentEdit";
import { useCommentInteractions } from "./useCommentInteractions";
import { useCommentRefresh } from "./useCommentRefresh";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useCommentActions = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  },
  useFallbackMode = false
) => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { t } = useTranslation();
  const deleteDemoComment = useDemoInteractionsStore(state => state.deleteComment);
  const toggleDemoCommentLike = useDemoInteractionsStore(state => state.toggleCommentLike);

  // Format user name helper
  const formatUserName = (fullName: string): string => {
    if (!fullName) return 'User';
    
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    }
    return fullName;
  };

  // Format current user info if available
  useEffect(() => {
    if (currentUser && currentUser.name) {
      // Apply "First name + first letter of last name" format
      const formattedName = formatUserName(currentUser.name);
      
      if (formattedName !== currentUser.name) {
        currentUser.name = formattedName;
      }
    }
  }, [currentUser]);

  // Import individual comment action hooks
  const { handleAddComment } = useCommentCreate(itemId, comments, setComments, currentUser, useFallbackMode);
  const { deleteComment } = useCommentDelete();
  const { handleEditComment } = useCommentEdit(comments, setComments);
  const { handleLikeComment: baseLikeComment, handleReplyToComment, handleReportComment } = useCommentInteractions(comments, setComments, currentUser);
  const { refreshComments, isRefreshing } = useCommentRefresh(itemId, setComments, currentUser);

  // Demo mode like handler
  const handleLikeComment = (commentId: string) => {
    if (DEMO_MODE) {
      toggleDemoCommentLike(itemId, commentId);
      // Update local state
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          const liked = !comment.isLiked;
          return { ...comment, isLiked: liked, likes: liked ? comment.likes + 1 : Math.max(0, comment.likes - 1) };
        }
        return comment;
      });
      setComments(updatedComments);
      return;
    }
    baseLikeComment(commentId);
  };

  // Enhanced delete comment handler to update the comments state properly
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Demo mode: delete from local store
      if (DEMO_MODE) {
        deleteDemoComment(itemId, commentId);
        const updatedComments = comments.filter(c => c.id !== commentId);
        setComments(updatedComments);
        toast({
          title: t('interactions.comment_deleted'),
          description: t('interactions.comment_deleted_description'),
        });
        return true;
      }
      
      // First perform the server-side deletion
      const success = await deleteComment(commentId);
      
      if (success) {
        // Remove the comment or reply from the client-side state
        const updatedComments = comments.filter(comment => {
          // If this is the comment to delete
          if (comment.id === commentId) {
            return false;
          }
          
          // Check if this comment has a reply that needs to be deleted
          if (comment.replies && comment.replies.length > 0) {
            // Filter out the reply to delete
            comment.replies = comment.replies.filter(reply => reply.id !== commentId);
          }
          
          return true;
        });
        
        // Update the comments state
        setComments(updatedComments);
        
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting comment:', error);
      return false;
    }
  };

  // Update the loading state based on the refreshing state
  useEffect(() => {
    setIsLoading(isRefreshing);
  }, [isRefreshing]);

  return {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment,
    refreshComments,
    isLoading
  };
};
