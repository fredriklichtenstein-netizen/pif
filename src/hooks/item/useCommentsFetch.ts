
import { useState, useEffect } from "react";
import { useToast } from "../use-toast";
import { useFetchComments } from "./comments/useFetchComments";
import { useCommentsCount } from "./comments/useCommentsCount";
import { useCommenters } from "./comments/useCommenters";

export const useCommentsFetch = (itemId: string) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  // Import the specialized hooks
  const { fetchComments, isLoading: isFetchLoading, error: fetchError } = useFetchComments(itemId);
  const { fetchCommentsCount } = useCommentsCount();
  const { fetchCommenters } = useCommenters();
  
  // Update loading and error states based on fetchComments states
  useEffect(() => {
    setIsLoading(isFetchLoading);
    if (fetchError) setError(fetchError);
  }, [isFetchLoading, fetchError]);
  
  return {
    fetchComments,
    fetchCommentsCount,
    fetchCommenters,
    isLoading,
    error
  };
};
