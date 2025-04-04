
import { useRef, useCallback } from "react";

/**
 * Hook to provide rate limiting functionality for operations like refreshing data
 * @param minInterval Minimum time in milliseconds between allowed operations
 */
export const useCommentRateLimiter = (minInterval: number = 2000) => {
  const lastOperationTime = useRef<number>(0);
  
  /**
   * Checks if an operation should be rate limited
   * @returns boolean indicating if the operation should be allowed
   */
  const shouldRateLimit = useCallback((): boolean => {
    const now = Date.now();
    return now - lastOperationTime.current < minInterval;
  }, [minInterval]);
  
  /**
   * Records that an operation was performed
   */
  const recordOperation = useCallback(() => {
    lastOperationTime.current = Date.now();
  }, []);
  
  return {
    shouldRateLimit,
    recordOperation
  };
};
