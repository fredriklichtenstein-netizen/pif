
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCommentDelete = (
  comments: Comment[],
  setComments: (comments: Comment[]) => void
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Delete a comment
  const handleDeleteComment = async (commentId: string) => {
    setIsLoading(true);
    try {
      // Call the Supabase API - convert string ID to number for Supabase
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', parseInt(commentId));
        
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
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleDeleteComment,
    isDeleting: isLoading
  };
};
