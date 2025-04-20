
import { useState } from "react";
import { useGlobalAuth } from "../../useGlobalAuth";
import { useCommentRetry } from "./useCommentRetry";
import { FALLBACK_COMMENTS } from "./fallbackComments";
import { useFetchCommentsCore } from "./useFetchCommentsCore";
import { Comment } from "@/types/comment";

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
