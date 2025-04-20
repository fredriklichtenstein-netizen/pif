
import { useState, useCallback } from 'react';
import { Comment } from '@/types/comment';
import { useComments } from '@/hooks/item/useComments';

export function useLazyComments(itemId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  
  const { fetchComments } = useComments(itemId);

  const loadComments = useCallback(async () => {
    if (isInitialized) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedComments = await fetchComments();
      setComments(fetchedComments);
      setIsInitialized(true);
    } catch (err) {
      console.error('Error loading comments:', err);
      setError(err instanceof Error ? err : new Error('Failed to load comments'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchComments, isInitialized]);

  return {
    comments,
    setComments,
    isLoading,
    error,
    loadComments,
    isInitialized
  };
}
