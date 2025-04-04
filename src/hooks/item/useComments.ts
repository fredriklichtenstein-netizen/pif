
import { useState, useEffect } from "react";
import { useCommentsFetch } from "./useCommentsFetch";
import { useCommentsMutations } from "./useCommentsMutations";
import type { User } from "./utils/userUtils";
import type { Comment } from "@/types/comment";

export const useComments = (itemId: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const { 
    fetchComments, 
    fetchCommentsCount, 
    fetchCommenters,
    isLoading: isFetchLoading,
    error: fetchError
  } = useCommentsFetch(itemId);
  
  const { 
    addComment, 
    deleteComment 
  } = useCommentsMutations(itemId);
  
  // Update loading and error states based on fetchComments states
  useEffect(() => {
    setIsLoading(isFetchLoading);
    if (fetchError) setError(fetchError);
  }, [isFetchLoading, fetchError]);
  
  return {
    fetchComments,
    addComment,
    deleteComment,
    fetchCommentsCount,
    fetchCommenters,
    isLoading,
    error
  };
};

// Re-export the types that consumers of this hook might need
export type { User, Comment };
