
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatCommentFromDB } from "@/hooks/item/utils/commentFormatters";

export const useCommentCreate = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  }
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Add a new comment
  const handleAddComment = async (text: string) => {
    if (!text.trim() || !currentUser || !currentUser.id) return;
    
    setIsLoading(true);
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      const { data, error } = await supabase
        .from('comments')
        .insert({
          item_id: numericItemId,
          user_id: currentUser.id,
          content: text
        })
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
        .single();
        
      if (error) throw error;
      
      if (data) {
        const newComment = formatCommentFromDB(data, true);
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

  return {
    handleAddComment,
    isCreating: isLoading
  };
};
