
// Extracted core fetchComments functionality

import { useCallback } from "react";
import { FALLBACK_COMMENTS } from "./fallbackComments";

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

  const fetchComments = useCallback(async (useFallback: boolean) => {
    setIsLoading(true);
    setError(null);

    if (useFallback) {
      // Use fallback comments immediately without attempting fetch
      setUseFallbackMode(true);
      setIsLoading(false);
      cleanUp();
      return FALLBACK_COMMENTS;
    }

    if (isMaxAttemptsReached()) {
      setUseFallbackMode(true);
      setIsLoading(false);
      cleanUp();
      return FALLBACK_COMMENTS;
    }

    const controller = createAbortController();

    try {
      // Simulate or do actual fetch here (example below, replace with real logic)
      // const response = await fetch(`api/comments/${itemId}`, { signal: controller.signal });
      // if (!response.ok) throw new Error("Fetch failed");
      // const data = await response.json();

      // Simulated fetch fallback just for placeholder:
      throw new Error("Fetch not implemented"); 

    } catch (error) {
      // Retry or fallback logic...
      console.error(error);
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
    maxAttempts
  ]);

  return { fetchComments };
};
