
import { useState, useEffect } from "react";
import { useToast } from "../use-toast";
import { useFetchComments } from "./comments/useFetchComments";
import { useCommentsCount } from "./comments/useCommentsCount";

export const useCommentsFetch = (itemId: string) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Import the specialized hooks
  const { 
    fetchComments, 
    isLoading: isFetchLoading, 
    error: fetchError, 
    useFallbackMode 
  } = useFetchComments(itemId);
  
  const { fetchCommentsCount } = useCommentsCount();

  // Update loading and error states based on fetchComments states
  useEffect(() => {
    setIsLoading(isFetchLoading);
    if (fetchError) setError(fetchError);
  }, [isFetchLoading, fetchError]);
  
  return {
    fetchComments,
    fetchCommentsCount,
    isLoading,
    error,
    useFallbackMode
  };
};
