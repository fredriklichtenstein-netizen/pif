
import { useCallback, useRef } from "react";

export const useCommentRetry = (maxRetries: number = 3) => {
  const attemptsRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const abortControllersRef = useRef<AbortController[]>([]);

  const createAbortController = useCallback(() => {
    const controller = new AbortController();
    abortControllersRef.current.push(controller);
    return controller;
  }, []);

  const setTimeout = useCallback((callback: () => void, ms: number) => {
    if (typeof window !== 'undefined') {
      const id = window.setTimeout(() => {
        callback();
        // Remove this timeout ID from our tracking array
        timeoutsRef.current = timeoutsRef.current.filter(t => t !== id);
      }, ms);
      timeoutsRef.current.push(id);
      return id;
    }
    return null;
  }, []);

  const cleanUp = useCallback(() => {
    // Clear all timeouts
    if (typeof window !== 'undefined') {
      timeoutsRef.current.forEach(id => {
        window.clearTimeout(id);
      });
    }
    timeoutsRef.current = [];
    
    // Abort all in-flight requests
    abortControllersRef.current.forEach(controller => {
      try {
        controller.abort();
      } catch (e) {
        console.warn("Error aborting request:", e);
      }
    });
    abortControllersRef.current = [];
  }, []);

  const resetAttempts = useCallback(() => {
    attemptsRef.current = 0;
  }, []);

  const incrementAttempts = useCallback(() => {
    attemptsRef.current += 1;
    return attemptsRef.current;
  }, []);

  const isMaxAttemptsReached = useCallback(() => {
    return attemptsRef.current >= maxRetries;
  }, [maxRetries]);

  const getCurrentAttempts = useCallback(() => {
    return attemptsRef.current;
  }, []);

  return {
    cleanUp,
    resetAttempts,
    incrementAttempts,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    setTimeout,
    maxAttempts: maxRetries
  };
};
