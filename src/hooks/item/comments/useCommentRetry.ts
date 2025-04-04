
import { useRef, useCallback } from "react";

export const useCommentRetry = (maxAttempts: number = 3) => {
  const fetchAttempts = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const abortController = useRef<AbortController | null>(null);
  
  // Clean up function to handle aborting requests and clearing timeouts
  const cleanUp = useCallback(() => {
    if (abortController.current) {
      try {
        abortController.current.abort();
      } catch (e) {
        console.log("Error aborting fetch:", e);
      }
      abortController.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // Reset attempt counter
  const resetAttempts = useCallback(() => {
    fetchAttempts.current = 0;
  }, []);
  
  // Increment attempt counter
  const incrementAttempts = useCallback(() => {
    fetchAttempts.current++;
    return fetchAttempts.current;
  }, []);
  
  // Check if max attempts reached
  const isMaxAttemptsReached = useCallback(() => {
    return fetchAttempts.current >= maxAttempts;
  }, [maxAttempts]);
  
  // Get current attempts
  const getCurrentAttempts = useCallback(() => {
    return fetchAttempts.current;
  }, []);
  
  // Create a new abort controller
  const createAbortController = useCallback(() => {
    cleanUp();
    abortController.current = new AbortController();
    return abortController.current;
  }, [cleanUp]);
  
  // Set timeout for request
  const setTimeout = useCallback((callback: () => void, ms: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = global.setTimeout(callback, ms);
    return timeoutRef.current;
  }, []);
  
  return {
    cleanUp,
    resetAttempts,
    incrementAttempts,
    isMaxAttemptsReached,
    getCurrentAttempts,
    createAbortController,
    setTimeout,
    maxAttempts
  };
};
