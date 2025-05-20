
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePostsBase, type UsePostsBaseOptions } from './usePostsBase';
import { transformItemsToPostsFormat } from './postTransformUtils';
import type { User } from '@supabase/supabase-js';

export function useUserPosts(options: UsePostsBaseOptions = {}) {
  const {
    setPosts,
    setIsLoading,
    setError,
    createAbortController,
    applyArchiveFilter,
    abortControllerRef,
  } = usePostsBase(options);

  const loadMyPosts = useCallback(async (currentUser?: User | null) => {
    if (!currentUser) {
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signal = createAbortController();
      
      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .eq('user_id', currentUser.id)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      // Apply archive filter if specified
      query = applyArchiveFilter(query);

      const { data: items, error: itemsError } = await query;
      
      if (signal.aborted) return;
      if (itemsError) throw itemsError;

      setPosts(transformItemsToPostsFormat(items));
      
    } catch (err) {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.error('Error loading my posts:', err);
        setError(err as Error);
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    setPosts, 
    setIsLoading, 
    setError, 
    createAbortController, 
    applyArchiveFilter, 
    abortControllerRef
  ]);

  return { loadMyPosts };
}
