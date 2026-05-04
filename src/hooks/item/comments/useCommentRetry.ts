
import { useState, useRef, useEffect } from "react";

export function useCommentRetry(maxRetries: number) {
  const attemptsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetAttempts = () => {
    attemptsRef.current = 0;
  };

  const isMaxAttemptsReached = () => {
    return attemptsRef.current >= maxRetries;
  };

  const getCurrentAttempts = () => {
    return attemptsRef.current;
  };

  const createAbortController = () => {
    // Always create a fresh controller; do not abort prior one here to avoid
    // racing with in-flight refetches that re-enter this code path.
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  const cleanUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    // Do not abort the controller here — the awaited request has already
    // resolved by the time cleanUp runs in `finally`. Aborting can cancel
    // a subsequent refetch that reused the ref.
    abortControllerRef.current = null;
  };

  const setTimeoutFn = (callback: () => void, delay: number) => {
    timeoutRef.current = global.setTimeout(callback, delay);
  };

  useEffect(() => {
    return () => {
      cleanUp();
    };
  }, []);

  return {
    cleanUp,
    resetAttempts,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    setTimeout: setTimeoutFn,
    maxAttempts: maxRetries,
  };
}
