
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
    
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`Attempting to load comments for item ${itemId} (attempt ${retryCount + 1})`);
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
      setIsInitialized(true);
      
      // Reset retry count on success
      if (retryCount > 0) {
        setRetryCount(0);
        toast({
          title: "Comments loaded successfully",
          description: "After some delays, we've successfully loaded the comments.",
          variant: "default"
        });
      }
    } catch (err) {
      console.error('Error loading comments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load comments';
      setError(err instanceof Error ? err : new Error(errorMessage));
      
      // Implement exponential backoff for retries (max 3 retries)
      if (retryCount < 3) {
        const nextRetryCount = retryCount + 1;
        const delay = Math.min(2000 * Math.pow(2, retryCount), 10000); // exponential backoff with max 10s
        
        console.log(`Scheduling retry ${nextRetryCount} after ${delay}ms`);
        
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
        // Max retries reached
        toast({
          title: "Failed to load comments",
          description: "Please try again later or refresh the page.",
          variant: "destructive"
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [fetchComments, isInitialized, itemId, retryCount, toast]);

  const refreshComments = useCallback(() => {
    setRetryCount(0);
    return loadComments(true);
  }, [loadComments]);

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
