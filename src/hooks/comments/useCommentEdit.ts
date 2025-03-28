
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCommentEdit = (
  comments: Comment[],
  setComments: (comments: Comment[]) => void
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Edit a comment
  const handleEditComment = async (commentId: string, newText: string) => {
    if (!newText.trim()) return;
    
    setIsLoading(true);
    try {
      // Call the Supabase API - convert string ID to number for Supabase
      const { error } = await supabase
        .from('comments')
        .update({ content: newText })
        .eq('id', parseInt(commentId));
        
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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleEditComment,
    isEditing: isLoading
  };
};
