
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { useToast } from "../use-toast";
import { useTranslation } from "react-i18next";
import { useGlobalAuth } from "../useGlobalAuth";
import { useAuthCheck } from "./utils/authCheck";
import { formatCommentFromDB } from "../item/utils/commentFormatters";

export const useCommentAdd = (itemId: string) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const { checkAuth } = useAuthCheck();
  
  // Add a comment to an item
  const addComment = async (content: string): Promise<Comment | null> => {
    if (!itemId || !content.trim()) return null;
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuth("add a comment");
    if (!isAuthenticated) return null;
    
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
          user_id: user?.id,
          content: content.trim()
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
      
      if (!data) return null;
      
      return formatCommentFromDB(data, true);
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };
  
  return { addComment };
};
