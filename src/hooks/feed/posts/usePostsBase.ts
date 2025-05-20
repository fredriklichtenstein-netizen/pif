
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UsePostsBaseOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

export function usePostsBase(options: UsePostsBaseOptions = {}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cancel any in-progress requests
  const cancelPendingRequests = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Create a new abort controller for this request
  const createAbortController = useCallback(() => {
    cancelPendingRequests();
    abortControllerRef.current = new AbortController();
    return abortControllerRef.current.signal;
  }, [cancelPendingRequests]);

  // Apply archive filter to a query based on options
  const applyArchiveFilter = useCallback((query: any) => {
    if (options.onlyArchived) {
      return query.not('archived_at', 'is', null);
    } else if (!options.includeArchived) {
      return query.is('archived_at', null);
    }
    return query;
  }, [options.includeArchived, options.onlyArchived]);

  // Cleanup function to abort any pending requests on unmount
  const cleanup = useCallback(() => {
    cancelPendingRequests();
  }, [cancelPendingRequests]);

  return {
    posts,
    setPosts,
    isLoading,
    setIsLoading,
    error,
    setError,
    createAbortController,
    applyArchiveFilter,
    cleanup,
    abortControllerRef
  };
}
