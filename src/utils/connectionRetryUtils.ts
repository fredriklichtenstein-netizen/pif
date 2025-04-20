
/**
 * Utility function to retry a function call with exponential backoff.
 *
 * @param fn The function to retry.  Should return a Promise.
 * @param options Options for the retry mechanism.
 * @param options.maxAttempts Maximum number of retry attempts.  Defaults to 3.
 * @param options.initialDelay Initial delay in milliseconds.  Defaults to 500ms.
 * @param options.maxDelay Maximum delay in milliseconds.  Defaults to 5000ms.
 * @param options.backoffFactor The factor by which to increase the delay each attempt.  Defaults to 1.5.
 * @param options.onRetry A callback function to execute on each retry.  Receives the attempt number and delay.
 * @param options.onFail A callback function to execute when all retries have failed.
 * @returns A Promise that resolves with the successful result of the function,
 *          or rejects if all retry attempts fail.
 */
export const withRetry = async <T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    onRetry?: (attempt: number, delay: number) => void;
    onFail?: () => void;
  } = {}
): Promise<T> => {
  const {
    maxAttempts = 3,
    initialDelay = 500,
    maxDelay = 5000,
    backoffFactor = 1.5,
    onRetry,
    onFail,
  } = options;

  let attempt = 0;
  let delay = initialDelay;

  while (attempt < maxAttempts) {
    try {
      return await fn();
    } catch (error) {
      attempt++;
      if (attempt >= maxAttempts) {
        onFail?.();
        throw error;
      }

      onRetry?.(attempt, delay);

      await new Promise((resolve) => setTimeout(resolve, delay));
      delay = Math.min(delay * backoffFactor, maxDelay);
    }
  }

  // This should never be reached, but included for extra safety.
  throw new Error("Max retry attempts reached without success.");
};

/**
 * Helper utility to add a timeout to a fetch operation
 * @param fetchFn Function that performs the fetch operation
 * @param timeoutMs Timeout in milliseconds
 * @returns Promise that will reject if the timeout is reached
 */
export const fetchWithTimeout = async <T>(fetchFn: () => Promise<T>, timeoutMs: number = 10000): Promise<T> => {
  return new Promise(async (resolve, reject) => {
    // Set up timeout
    const timeoutId = setTimeout(() => {
      reject(new Error('Request timed out'));
    }, timeoutMs);
    
    try {
      // Execute the fetch function
      const result = await fetchFn();
      clearTimeout(timeoutId);
      resolve(result);
    } catch (error) {
      clearTimeout(timeoutId);
      reject(error);
    }
  });
};

/**
 * Check if an error is likely a network-related error
 * @param error The error to check
 * @returns True if it appears to be a network error
 */
export const isNetworkError = (error: any): boolean => {
  if (!error) return false;
  
  // Check error name
  if (error.name === 'AbortError' || error.name === 'TimeoutError') return true;
  
  // Check error message for common network-related terms
  const errorMessage = String(error.message || error).toLowerCase();
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('failed to fetch') ||
    errorMessage.includes('abort') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('unreachable')
  );
};
