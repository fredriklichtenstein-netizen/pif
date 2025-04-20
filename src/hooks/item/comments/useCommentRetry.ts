
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
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current;
  };

  const cleanUp = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
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
