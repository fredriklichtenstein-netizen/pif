
import { useState, useCallback, useEffect } from 'react';
import { Comment } from '@/types/comment';
import { useComments } from '@/hooks/item/useComments';
import { useToast } from '@/hooks/use-toast';

export function useLazyComments(itemId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  
  const { fetchComments } = useComments(itemId);

  // Cleanup function for any timers
  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryTimer]);

  const loadComments = useCallback(async (forceRefresh = false) => {
    if (isInitialized && !forceRefresh) return;
    
    console.log(`[useLazyComments] Starting to load comments for item ${itemId}`);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[useLazyComments] Attempting to load comments for item ${itemId} (attempt ${retryCount + 1})`);
      const fetchedComments = await fetchComments();
      
      // If comments are returned successfully
      if (Array.isArray(fetchedComments)) {
        console.log(`[useLazyComments] Successfully loaded ${fetchedComments.length} comments for item ${itemId}`);
        setComments(fetchedComments);
        setIsInitialized(true);
        setRetryCount(0); // Reset retry count on success
        setIsLoading(false);
        
        // Show toast on retries
        if (retryCount > 0) {
          toast({
            title: "Comments loaded successfully",
            description: "After some delays, we've successfully loaded the comments.",
            variant: "default"
          });
        }
      } else {
        // Handle case where fetchComments didn't return an array
        throw new Error("Failed to fetch comments: Invalid response format");
      }
    } catch (err) {
      console.error('[useLazyComments] Error loading comments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load comments';
      setError(err instanceof Error ? err : new Error(errorMessage));
      
      // Implement exponential backoff for retries (max 3 retries)
      if (retryCount < 3) {
        const nextRetryCount = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, nextRetryCount), 8000); // exponential backoff with max 8s
        
        console.log(`[useLazyComments] Scheduling retry ${nextRetryCount} after ${delay}ms`);
        
        const timer = setTimeout(() => {
          setRetryCount(nextRetryCount);
          loadComments(true);
        }, delay);
        
        setRetryTimer(timer);
        
        // Show toast on first failure
        if (retryCount === 0) {
          toast({
            title: "Comments temporarily unavailable",
            description: "We're having trouble loading comments. Retrying...",
            variant: "destructive"
          });
        }
      } else {
        // Max retries reached - set initialized to true to stop continuous retry attempts
        setIsInitialized(true);
        setIsLoading(false);
        toast({
          title: "Failed to load comments",
          description: "Please try again later or refresh the page.",
          variant: "destructive"
        });
      }
    }
  }, [fetchComments, isInitialized, itemId, retryCount, toast]);

  const refreshComments = useCallback(() => {
    console.log(`[useLazyComments] Refreshing comments for item ${itemId}`);
    setRetryCount(0);
    setIsInitialized(false); // Reset initialization to force refresh
    return loadComments(true);
  }, [loadComments, itemId]);

  return {
    comments,
    setComments,
    isLoading,
    error,
    loadComments,
    refreshComments,
    isInitialized
  };
}
