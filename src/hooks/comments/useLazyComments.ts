
import { useState, useCallback, useEffect } from 'react';
import { Comment } from '@/types/comment';
import { useComments } from '@/hooks/item/useComments';
import { useToast } from '@/hooks/use-toast';
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
  const { fetchComments, useFallbackMode: fetchFallbackMode } = useComments(itemId);
  const getComments = useDemoInteractionsStore(state => state.getComments);

  const formatUserName = (fullName: string): string => {
    if (!fullName) return 'User';
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    }
    return fullName;
  };

  useEffect(() => {
    if (fetchFallbackMode) {
      setUseFallbackMode(true);
    }
  }, [fetchFallbackMode]);

  useEffect(() => {
    return () => {
      if (retryTimer) {
        clearTimeout(retryTimer);
      }
    };
  }, [retryTimer]);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (useFallbackMode && user?.id && isInitialized) {
      try {
        const pendingCommentsJson = localStorage.getItem(`pending_comments_${itemId}`);
        if (!pendingCommentsJson) return;
        const pendingComments = JSON.parse(pendingCommentsJson);
        if (!Array.isArray(pendingComments) || pendingComments.length === 0) return;
        const existingIds = new Set(comments.map(c => c.id));
        const newPendingComments = pendingComments.filter(pc => !existingIds.has(pc.id));
        if (newPendingComments.length > 0) {
          const displayName = formatUserName(
            user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0] || 'User'
          );
          const formattedComments = newPendingComments.map((pc: any) => ({
            id: pc.id, text: pc.content,
            author: { id: user.id, name: displayName, avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random` },
            createdAt: new Date(pc.createdAt), likes: 0, isLiked: false, replies: [], isOwn: true, isPending: true
          }));
          setComments([...comments, ...formattedComments]);
        }
      } catch (err) { console.error("Error processing pending comments:", err); }
    }
  }, [useFallbackMode, user, itemId, isInitialized, comments, setComments]);

  const loadComments = useCallback(async (forceRefresh = false) => {
    if (isInitialized && !forceRefresh) return;
    if (DEMO_MODE) {
      const demoComments = getComments(itemId);
      setComments(demoComments);
      setIsInitialized(true);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedComments = await fetchComments();
      
      if (Array.isArray(fetchedComments)) {
        setComments(fetchedComments);
        setIsInitialized(true);
        setRetryCount(0);
        setIsLoading(false);
        
        if (fetchFallbackMode) {
          setUseFallbackMode(true);
          toast({ title: t('interactions.limited_connection'), description: t('interactions.limited_connection_description'), variant: "default" });
        }
        if (retryCount > 0 && !fetchFallbackMode) {
          toast({ title: t('interactions.comments_loaded'), description: t('interactions.comments_loaded_description'), variant: "default" });
        }
      } else {
        throw new Error("Failed to fetch comments: Invalid response format");
      }
    } catch (err) {
      console.error('[useLazyComments] Error loading comments:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to load comments';
      setError(err instanceof Error ? err : new Error(errorMessage));
      
      if (fetchFallbackMode) {
        setUseFallbackMode(true);
        setIsInitialized(true);
        setIsLoading(false);
        const fallbackComments = await fetchComments();
        if (Array.isArray(fallbackComments)) setComments(fallbackComments);
      } else if (retryCount === 0) {
        setUseFallbackMode(true);
        setIsInitialized(true);
        setIsLoading(false);
        const fallbackComments = await fetchComments();
        if (Array.isArray(fallbackComments)) setComments(fallbackComments);
        toast({ title: t('interactions.comments_unavailable'), description: t('interactions.comments_unavailable_description'), variant: "default" });
      } else if (retryCount < 2) {
        const nextRetryCount = retryCount + 1;
        const delay = Math.min(1000 * Math.pow(2, nextRetryCount), 8000);
        const timer = setTimeout(() => { setRetryCount(nextRetryCount); loadComments(true); }, delay);
        setRetryTimer(timer);
      } else {
        setUseFallbackMode(true);
        setIsInitialized(true);
        setIsLoading(false);
        const fallbackComments = await fetchComments();
        if (Array.isArray(fallbackComments)) setComments(fallbackComments);
        toast({ title: t('interactions.offline_comments'), description: t('interactions.offline_comments_description'), variant: "default" });
      }
    }
  }, [fetchComments, isInitialized, itemId, retryCount, toast, fetchFallbackMode, getComments, t]);

  const refreshComments = useCallback(() => {
    setRetryCount(0);
    setIsInitialized(false);
    return loadComments(true);
  }, [loadComments, itemId]);

  return { comments, setComments, isLoading, error, loadComments, refreshComments, isInitialized, useFallbackMode };
}
