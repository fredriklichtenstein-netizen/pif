
export interface RetryOptions {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffFactor: number;
  onRetry?: (attempt: number, delay: number) => void;
  onSuccess?: () => void;
  onFail?: (error: Error) => void;
}

/**
 * Utility function to perform operations with exponential backoff retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    onRetry,
    onSuccess,
    onFail
  } = options;

  let attempt = 0;
  let lastError: Error;

  while (attempt < maxAttempts) {
    try {
      const result = await operation();
      if (onSuccess) onSuccess();
      return result;
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      attempt++;
      
      if (attempt >= maxAttempts) {
        if (onFail) onFail(lastError);
        throw lastError;
      }
      
      // Calculate backoff delay with jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 + 0.85; // Random value between 0.85 and 1.15
      const delay = Math.min(initialDelay * Math.pow(backoffFactor, attempt - 1) * jitter, maxDelay);
      
      if (onRetry) onRetry(attempt, delay);
      console.log(`Retry attempt ${attempt}/${maxAttempts} after ${delay}ms`, lastError);
      
      // Wait for the backoff period
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  // This shouldn't be reached, but TypeScript requires a return
  throw lastError!;
}

/**
 * Creates an abortable fetch with timeout
 */
export function fetchWithTimeout(
  input: RequestInfo | URL,
  init?: RequestInit & { timeout?: number }
): Promise<Response> {
  const timeout = init?.timeout || 8000;
  const controller = new AbortController();
  const signal = controller.signal;
  
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeout);
  
  return fetch(input, {
    ...init,
    signal
  }).finally(() => {
    clearTimeout(timeoutId);
  });
}

/**
 * Check if an error is a network-related error
 */
export function isNetworkError(error: unknown): boolean {
  if (!error) return false;
  
  const errorMessage = error instanceof Error 
    ? error.message.toLowerCase() 
    : String(error).toLowerCase();
  
  return (
    errorMessage.includes('network') ||
    errorMessage.includes('internet') ||
    errorMessage.includes('offline') ||
    errorMessage.includes('connection') ||
    errorMessage.includes('timeout') ||
    errorMessage.includes('abort') ||
    errorMessage.includes('unreachable') ||
    errorMessage.includes('failed to fetch') ||
    error instanceof TypeError && errorMessage.includes('fetch')
  );
}
