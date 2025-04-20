
import { useRef } from "react";
import { FALLBACK_COMMENTS } from "./fallbackComments";
import { parseNumericItemId } from "./parseNumericItemId";
import { runCommentQuery } from "./commentQuery";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "../../useGlobalAuth";
import { useCommentRetry } from "./useCommentRetry";
import { withRetry } from "@/utils/connectionRetryUtils";

type FetchOptions = {
  setError: (err: Error | null) => void;
  setIsLoading: (loading: boolean) => void;
  setUseFallbackMode: (fallback: boolean) => void;
  cleanUp: () => void;
  resetAttempts: () => void;
  isMaxAttemptsReached: () => boolean;
  getCurrentAttempts: () => number;
  createAbortController: () => AbortController;
  maxAttempts: number;
};

export function useFetchCommentsCore(itemId: string, options: FetchOptions) {
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useGlobalAuth();

  const fetchComments = async (useFallbackMode: boolean): Promise<Comment[]> => {
    if (!itemId) return [];
    options.cleanUp();

    // Abort previous fetch if needed
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        // no-op
      }
    }
    let controller: AbortController | null = null;
    try {
      controller = options.createAbortController();
      abortControllerRef.current = controller;
    } catch (e) {
      // no-op
    }

    options.setIsLoading(true);
    options.setError(null);

    const numericItemId = parseNumericItemId(itemId);
    if (!numericItemId) {
      options.setUseFallbackMode(true);
      options.setIsLoading(false);
      return [...FALLBACK_COMMENTS];
    }

    try {
      const result = await withRetry<Comment[]>(
        async () => {
          if (useFallbackMode) {
            return [...FALLBACK_COMMENTS];
          }
          return runCommentQuery(numericItemId, user?.id, controller);
        },
        {
          maxAttempts: 2,
          initialDelay: 800,
          maxDelay: 2000,
          backoffFactor: 1.5,
          onRetry: (attempt, delay) => {},
          onFail: () => {
            options.setUseFallbackMode(true);
          }
        }
      );

      options.resetAttempts();
      options.setIsLoading(false);
      return result;
    } catch (error: any) {
      const isAbortError = error?.name === 'AbortError'
        || error?.message?.includes('aborted')
        || error?.message?.includes('signal');
      if (isAbortError) {
        if (options.isMaxAttemptsReached()) {
          options.setUseFallbackMode(true);
          options.resetAttempts();
          options.setIsLoading(false);
          return [...FALLBACK_COMMENTS];
        }
        options.setUseFallbackMode(true);
        options.resetAttempts();
        options.setIsLoading(false);
        return [...FALLBACK_COMMENTS];
      }
      options.setError(error instanceof Error ? error : new Error(String(error)));
      options.setIsLoading(false);
      if (options.isMaxAttemptsReached()) {
        options.setUseFallbackMode(true);
        return [...FALLBACK_COMMENTS];
      }
      return [];
    }
  };

  return { fetchComments };
}
