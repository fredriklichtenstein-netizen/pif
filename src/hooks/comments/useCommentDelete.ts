
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { useTranslation } from "react-i18next";
import { useGlobalAuth } from "../useGlobalAuth";
import { useAuthCheck } from "./utils/authCheck";

export const useCommentDelete = () => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const { user } = useGlobalAuth();
  const { checkAuth } = useAuthCheck();
  
  // Delete a comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!commentId) return false;
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuth("delete a comment");
    if (!isAuthenticated) return false;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', parseInt(commentId))
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: t('interactions.error_title'),
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };

  return { deleteComment };
};

// For backward compatibility
export const useCommentRemove = useCommentDelete;
