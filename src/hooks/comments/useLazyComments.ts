
import { useState, useCallback, useEffect } from 'react';
import { Comment } from '@/types/comment';
import { useComments } from '@/hooks/item/useComments';
import { useToast } from '@/hooks/use-toast';
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";

export function useLazyComments(itemId: string) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [retryTimer, setRetryTimer] = useState<NodeJS.Timeout | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  const { toast } = useToast();
  const { user } = useGlobalAuth();
  
  const { fetchComments, useFallbackMode: fetchFallbackMode } = useComments(itemId);
  const getComments = useDemoInteractionsStore(state => state.getComments);

  // Format user name as "First name + first letter of last name"
  const formatUserName = (fullName: string): string => {
    if (!fullName) return 'User';
    
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    }
    return fullName;
  };

  // Update our fallback mode state when fetch fallback mode changes
  useEffect(() => {
    if (fetchFallbackMode) {
      setUseFallbackMode(true);
    }
  }, [fetchFallbackMode]);

  // Cleanup function for any timers
  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryTimer]);

  // Process pending comments from localStorage
  useEffect(() => {
    // Skip in demo mode
    if (DEMO_MODE) return;
    
    // Only process local comments if in fallback mode and we have a current user
    if (useFallbackMode && user?.id && isInitialized) {
      try {
        const pendingCommentsJson = localStorage.getItem(`pending_comments_${itemId}`);
        if (!pendingCommentsJson) return;
        
        const pendingComments = JSON.parse(pendingCommentsJson);
        if (!Array.isArray(pendingComments) || pendingComments.length === 0) return;
        
        const existingIds = new Set(comments.map(c => c.id));
        const newPendingComments = pendingComments.filter(pc => !existingIds.has(pc.id));
        
        if (newPendingComments.length > 0) {
          // Format user display name properly
          const displayName = formatUserName(
            user.user_metadata?.full_name || 
            user.user_metadata?.name || 
            user.email?.split('@')[0] || 
            'User'
          );
          
          const formattedComments = newPendingComments.map((pc: any) => ({
            id: pc.id,
            text: pc.content,
            author: {
              id: user.id,
              name: displayName,
              avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
            },
            createdAt: new Date(pc.createdAt),
            likes: 0,
            isLiked: false,
            replies: [],
            isOwn: true,
            isPending: true
          }));
          
          setComments([...comments, ...formattedComments]);
        }
      } catch (err) {
        console.error("Error processing pending comments:", err);
      }
    }
  }, [useFallbackMode, user, itemId, isInitialized, comments, setComments]);

  const loadComments = useCallback(async (forceRefresh = false) => {
    if (isInitialized && !forceRefresh) return;
    
    // Demo mode: load from local store immediately
    if (DEMO_MODE) {
      const demoComments = getComments(itemId);
      setComments(demoComments);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    
    console.log(`[useLazyComments] Starting to load comments for item ${itemId}`);
    setIsLoading(true);
    setError(null);
    
    try {
      console.log(`[useLazyComments] Attempting to load comments for item ${itemId} (attempt ${retryCount + 1})`);
      const fetchedComments = await fetchComments();
      
      // If comments are returned successfully (even if it's an empty array)
      if (Array.isArray(fetchedComments)) {
        console.log(`[useLazyComments] Successfully loaded ${fetchedComments.length} comments for item ${itemId}`);
        setComments(fetchedComments);
        setIsInitialized(true);
        setRetryCount(0); // Reset retry count on success
        setIsLoading(false);
        
        // If we're in fallback mode, show a toast
        if (fetchFallbackMode) {
          setUseFallbackMode(true);
          toast({
            title: "Limited connection mode",
            description: "Showing available comments. Your new comments will be saved when connection improves.",
            variant: "default"
          });
        }
        
        // Show toast on retries
        if (retryCount > 0 && !fetchFallbackMode) {
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
      
      // If we're in fallback mode from the fetch hook, adopt that here too
      if (fetchFallbackMode) {
        setUseFallbackMode(true);
        setIsInitialized(true);
        setIsLoading(false);
        const fallbackComments = await fetchComments(); // This should return fallback data
        if (Array.isArray(fallbackComments)) {
          setComments(fallbackComments);
        }
      }
      // Implement immediate fallback mode after first attempt failure
      else if (retryCount === 0) {
        setUseFallbackMode(true);
        setIsInitialized(true);
        setIsLoading(false);
        const fallbackComments = await fetchComments(); // This should return fallback data
        if (Array.isArray(fallbackComments)) {
          setComments(fallbackComments);
        }
        toast({
          title: "Comments temporarily unavailable",
          description: "Using offline mode for comments. Your new comments will be saved when connection improves.",
          variant: "default"
        });
      }
      // Keep the old fallback with retries as a last resort
      else if (retryCount < 2) {
        const nextRetryCount = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, nextRetryCount), 8000); // exponential backoff with max 8s
        
        console.log(`[useLazyComments] Scheduling retry ${nextRetryCount} after ${delay}ms`);
        
        const timer = setTimeout(() => {
          setRetryCount(nextRetryCount);
          loadComments(true);
        }, delay);
        
        setRetryTimer(timer);
      } else {
        // Max retries reached - switch to fallback
        setUseFallbackMode(true);
        setIsInitialized(true);
        setIsLoading(false);
        const fallbackComments = await fetchComments(); // This should return fallback data
        if (Array.isArray(fallbackComments)) {
          setComments(fallbackComments);
        }
        toast({
          title: "Using offline comments mode",
          description: "We'll try to sync your comments when connection improves.",
          variant: "default"
        });
      }
    }
  }, [fetchComments, isInitialized, itemId, retryCount, toast, fetchFallbackMode, getComments]);

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
    isInitialized,
    useFallbackMode
  };
}
