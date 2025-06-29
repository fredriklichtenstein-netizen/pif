
import { supabase } from "@/integrations/supabase/client";

// Connection pool configuration
export const DB_CONFIG = {
  maxConnections: 10,
  idleTimeout: 30000,
  connectionTimeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
} as const;

// Enhanced error handling for database operations
export class DatabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DatabaseError';
  }
}

// Retry wrapper for database operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts = DB_CONFIG.retryAttempts
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === maxAttempts) {
        throw new DatabaseError(
          `Operation failed after ${maxAttempts} attempts: ${lastError.message}`,
          'MAX_RETRIES_EXCEEDED',
          { originalError: lastError, attempts: maxAttempts }
        );
      }
      
      // Exponential backoff
      const delay = DB_CONFIG.retryDelay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

// Health check for database connection
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return !error;
  } catch {
    return false;
  }
};
