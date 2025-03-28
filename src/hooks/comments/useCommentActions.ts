
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { v4 as uuidv4 } from "uuid";

interface CommentUser {
  id?: string;
  name?: string;
  avatar?: string;
}

export const useCommentActions = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: CommentUser
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Add a new comment
  const handleAddComment = async (text: string) => {
    if (!text.trim() || !currentUser || !currentUser.id) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          item_id: parseInt(itemId),
          user_id: currentUser.id,
          content: text
        })
        .select()
        .single();
        
      if (error) throw error;
      
      if (data) {
        // Add the new comment to the list
        const newComment: Comment = {
          id: data.id.toString(),
          text: data.content,
          author: {
            id: currentUser.id,
            name: currentUser.name || 'User',
            avatar: currentUser.avatar || ''
          },
          likes: 0,
          isLiked: false,
          replies: [],
          createdAt: new Date(data.created_at),
          isOwn: true
        };
        
        setComments([...comments, newComment]);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: "Failed to add comment",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    try {
      // Call the Supabase API
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);
        
      if (error) throw error;
      
      // Remove the comment from the UI
      const updatedComments = comments.filter(comment => comment.id !== commentId);
      setComments(updatedComments);
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: "Failed to delete comment",
        variant: "destructive"
      });
    }
  };

  // Edit a comment
  const handleEditComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) return;
    
    try {
      // Call the Supabase API
      const { error } = await supabase
        .from('comments')
        .update({ content: newText })
        .eq('id', commentId);
        
      if (error) throw error;
      
      // Update the comment in the UI
      const updatedComments = comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, text: newText };
        }
        return comment;
      });
      
      setComments(updatedComments);
    } catch (error) {
      console.error("Error editing comment:", error);
      toast({
        title: "Error",
        description: "Failed to update comment",
        variant: "destructive"
      });
    }
  };

  // Add a reply to a comment
  const handleReplyToComment = (commentId: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    
    // Find the parent comment and add the reply
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newReply: Comment = {
          id: uuidv4(),
          text,
          author: {
            id: currentUser.id,
            name: currentUser.name || 'User',
            avatar: currentUser.avatar || ''
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

  // Force refresh comments
  const refreshComments = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('item_id', parseInt(itemId))
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (data) {
        // Format and update comments
        const formattedComments: Comment[] = data.map(comment => ({
          id: comment.id.toString(),
          text: comment.content,
          author: {
            id: comment.user_id,
            name: comment.profiles ? 
              `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim() || 'User' : 
              'User',
            avatar: comment.profiles?.avatar_url || ''
          },
          likes: 0, // TODO: Fetch actual likes
          isLiked: false,
          replies: [],
          createdAt: new Date(comment.created_at),
          isOwn: currentUser?.id === comment.user_id
        }));
        
        setComments(formattedComments);
      }
    } catch (error) {
      console.error("Error refreshing comments:", error);
      toast({
        title: "Error",
        description: "Failed to refresh comments",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

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
