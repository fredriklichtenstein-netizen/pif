
// Extracted core fetchComments functionality

import { useCallback } from "react";
import { getFallbackComments } from "./fallbackComments";
import { runCommentQuery } from "./commentQuery";
import { useGlobalAuth } from "../../useGlobalAuth";

interface CoreCallbacks {
  setError: React.Dispatch<React.SetStateAction<Error | null>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
  setUseFallbackMode: React.Dispatch<React.SetStateAction<boolean>>;
  cleanUp: () => void;
  resetAttempts: () => void;
  isMaxAttemptsReached: () => boolean;
  getCurrentAttempts: () => number;
  createAbortController: () => AbortController;
  maxAttempts: number;
}

export const useFetchCommentsCore = (itemId: string, callbacks: CoreCallbacks) => {
  const { 
    setError,
    setIsLoading,
    setUseFallbackMode,
    cleanUp,
    resetAttempts,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    maxAttempts
  } = callbacks;
  
  const { user } = useGlobalAuth();
  const userId = user?.id;

  const fetchComments = useCallback(async (useFallback: boolean) => {
    setIsLoading(true);
    setError(null);

    if (useFallback) {
      // Use fallback comments immediately without attempting fetch
      setUseFallbackMode(true);
      setIsLoading(false);
      cleanUp();
      return getFallbackComments();
    }

    if (isMaxAttemptsReached()) {
      setUseFallbackMode(true);
      setIsLoading(false);
      cleanUp();
      return getFallbackComments();
    }

    const controller = createAbortController();

    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Fetching comments for item ${numericItemId}, user: ${userId || 'unknown'}`);
      
      // Use the runCommentQuery function to fetch comments
      const comments = await runCommentQuery(numericItemId, userId, controller);
      console.log(`Fetched ${comments.length} comments for item ${numericItemId}`);
      
      setIsLoading(false);
      return comments;
    } catch (error) {
      // Retry or fallback logic...
      console.error("Error fetching comments:", error);
      setError(error as Error);
      setIsLoading(false);

      if (getCurrentAttempts() >= maxAttempts) {
        setUseFallbackMode(true);
        return FALLBACK_COMMENTS;
      }
      return [];
    } finally {
      cleanUp();
    }

  }, [
    setError,
    setIsLoading,
    setUseFallbackMode,
    cleanUp,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    maxAttempts,
    itemId,
    userId
  ]);

  return { fetchComments };
};
