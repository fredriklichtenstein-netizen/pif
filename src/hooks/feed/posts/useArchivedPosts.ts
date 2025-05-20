
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePostsBase } from './usePostsBase';
import { transformItemsToPostsFormat } from './postTransformUtils';
import type { User } from '@supabase/supabase-js';

export function useArchivedPosts() {
  const {
    setPosts,
    setIsLoading,
    setError,
    createAbortController,
    abortControllerRef,
  } = usePostsBase();

  const loadArchivedPosts = useCallback(async (currentUser?: User | null) => {
    if (!currentUser) {
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signal = createAbortController();
      
      const { data: items, error: itemsError } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .eq('user_id', currentUser.id)
        .not('archived_at', 'is', null) // Only archived items
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
      if (signal.aborted) return;
      if (itemsError) throw itemsError;

      setPosts(transformItemsToPostsFormat(items));
      
    } catch (err) {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.error('Error loading archived posts:', err);
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
    abortControllerRef
  ]);

  return { loadArchivedPosts };
}
