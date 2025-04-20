
import { useState } from "react";
import { Comment } from "@/types/comment";
import { useToast } from "@/hooks/use-toast";

export const useCommentInteractions = (
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  }
) => {
  const { toast } = useToast();
  
  // Like a comment
  const handleLikeComment = (commentId: string) => {
    // Find the comment and toggle like
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const liked = !comment.isLiked;
        const newLikes = liked ? comment.likes + 1 : Math.max(0, comment.likes - 1);
        return { ...comment, isLiked: liked, likes: newLikes };
      }
      return comment;
    });
    
    setComments(updatedComments);
    
    // TODO: Add backend API call to update likes
  };

  // Format user name as "First name + first letter of last name"
  const formatUserName = (fullName: string): string => {
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    }
    return fullName || 'User';
  };

  // Add a reply to a comment
  const handleReplyToComment = (commentId: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    
    // Find the parent comment and add the reply
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        // Generate a unique ID for the comment
        const newId = Date.now().toString();
        
        // Format name properly
        const displayName = currentUser.name 
          ? formatUserName(currentUser.name)
          : 'User';
        
        // Create the reply with proper user info
        const newReply: Comment = {
          id: newId,
          text,
          author: {
            id: currentUser.id || '',
            name: displayName,
            avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
          },
          likes: 0,
          isLiked: false,
          replies: [],
          createdAt: new Date(),
          isOwn: true
        };
        
        return {
          ...comment,
          replies: [...comment.replies, newReply]
        };
      }
      return comment;
    });
    
    setComments(updatedComments);
    
    // TODO: Add backend API call to save reply
  };

  // Report a comment
  const handleReportComment = (commentId: string) => {
    toast({
      title: "Comment reported",
      description: "Thank you for helping keep our community safe"
    });
    
    // TODO: Add backend API call to report comment
  };

  return {
    handleLikeComment,
    handleReplyToComment,
    handleReportComment,
  };
};
