
import { useState, useCallback } from "react";
import { Comment } from "@/types/comment";
import { useCommentsFetch } from "@/hooks/item/useCommentsFetch";
import { useToast } from "@/hooks/use-toast";
import { useCommentRateLimiter } from "./useCommentRateLimiter";
import { useTranslation } from "react-i18next";

export const useCommentsCore = (
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
  const { shouldRateLimit, recordOperation } = useCommentRateLimiter();
  const { t } = useTranslation();
  
  const refreshComments = useCallback(async () => {
    if (!itemId) return;
    
    if (shouldRateLimit()) {
      return;
    }
    
    recordOperation();
    
    setIsRefreshing(true);
    try {
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
    } catch (error) {
      console.error("Error refreshing comments:", error);
      toast({
        title: t('post.error'),
        description: t('interactions.comments_refresh_error'),
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [itemId, fetchComments, setComments, toast, shouldRateLimit, recordOperation, t]);

  return {
    refreshComments,
    isRefreshing
  };
};
