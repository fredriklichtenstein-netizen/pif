
// Refactored to focus only on hook useFetchComments and imports

import { useState } from "react";
import { useGlobalAuth } from "../../useGlobalAuth";
import { FALLBACK_COMMENTS } from "./fallbackComments";
import { useFetchCommentsCore } from "./useFetchCommentsCore";
import { useCommentRetry } from "./useCommentRetry";

export const useFetchComments = (itemId: string) => {
  const { user } = useGlobalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(false);

  const {
    cleanUp,
    resetAttempts,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    setTimeout: setTimeoutFn,
    maxAttempts
  } = useCommentRetry(3);

  const { fetchComments } = useFetchCommentsCore(itemId, {
    setError,
    setIsLoading,
    setUseFallbackMode,
    cleanUp,
    resetAttempts,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    maxAttempts
  });

  return {
    fetchComments: () => fetchComments(useFallbackMode),
    isLoading,
    error,
    useFallbackMode
  };
};

