
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const useCommentRefresh = (
  itemId: string,
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  }
) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Force refresh comments
  const refreshComments = async () => {
    setIsLoading(true);
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
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
        .eq('item_id', numericItemId)
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
    refreshComments,
    isRefreshing: isLoading
  };
};
