
import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePostsBase, type UsePostsBaseOptions } from './usePostsBase';
import { transformItemsToPostsFormat } from './postTransformUtils';
import type { User } from '@supabase/supabase-js';

export function useSavedPosts(options: UsePostsBaseOptions = {}) {
  const {
    setPosts,
    setIsLoading,
    setError,
    createAbortController,
    applyArchiveFilter,
    abortControllerRef,
  } = usePostsBase(options);

  const loadSavedPosts = useCallback(async (currentUser?: User | null) => {
    if (!currentUser) {
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signal = createAbortController();
      
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('item_id')
        .eq('user_id', currentUser.id)
        .abortSignal(signal);

      if (signal.aborted) return;
      if (bookmarksError) throw bookmarksError;

      const itemIds = bookmarks.map(bookmark => bookmark.item_id);
      
      if (itemIds.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .in('id', itemIds)
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
        console.error('Error loading saved posts:', err);
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

  return { loadSavedPosts };
}
