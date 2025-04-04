
import { useState, useCallback } from "react";
import { Comment } from "@/types/comment";
import { useCommentsFetch } from "@/hooks/item/useCommentsFetch";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { fetchComments } = useCommentsFetch(itemId);
  const { toast } = useToast();

  const refreshComments = useCallback(async () => {
    if (!itemId) return;
    
    setIsRefreshing(true);
    try {
      console.log(`Refreshing comments for item ${itemId}`);
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
      console.log(`Refreshed ${fetchedComments.length} comments`);
    } catch (error) {
      console.error("Error refreshing comments:", error);
      toast({
        title: "Error",
        description: "Failed to refresh comments",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [itemId, fetchComments, setComments, toast]);

  return {
    refreshComments,
    isRefreshing
  };
};
