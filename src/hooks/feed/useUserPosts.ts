
import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { extractUserFromProfile } from '@/hooks/item/utils/userUtils';
import { useGlobalAuth } from '../useGlobalAuth';

interface UseUserPostsOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

export function useUserPosts(options: UseUserPostsOptions = {}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { user } = useGlobalAuth();

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

  // Load saved posts (bookmarked items)
  const loadSavedPosts = useCallback(async (currentUser = user) => {
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
        return;
      }

      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .in('id', itemIds)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      // Apply archive filter if specified
      if (options.onlyArchived) {
        query = query.not('archived_at', 'is', null);
      } else if (!options.includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data: items, error: itemsError } = await query;
      
      if (signal.aborted) return;
      if (itemsError) throw itemsError;

      const transformedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        images: item.images,
        location: item.location,
        coordinates: item.coordinates,
        category: item.category,
        condition: item.condition,
        measurements: item.measurements,
        user_id: item.user_id,
        status: item.status,
        archived_at: item.archived_at,
        archived_reason: item.archived_reason,
        user_name: extractUserFromProfile(item.profiles, item.user_id).name,
        user_avatar: extractUserFromProfile(item.profiles, item.user_id).avatar || '',
      }));

      setPosts(transformedItems);
      
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
  }, [user, options.includeArchived, options.onlyArchived, createAbortController]);

  // Load my posts
  const loadMyPosts = useCallback(async (currentUser = user) => {
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
      if (options.onlyArchived) {
        query = query.not('archived_at', 'is', null);
      } else if (!options.includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data: items, error: itemsError } = await query;
      
      if (signal.aborted) return;
      if (itemsError) throw itemsError;

      const transformedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        images: item.images,
        location: item.location,
        coordinates: item.coordinates,
        category: item.category,
        condition: item.condition,
        measurements: item.measurements,
        user_id: item.user_id,
        status: item.status,
        archived_at: item.archived_at,
        archived_reason: item.archived_reason,
        user_name: extractUserFromProfile(item.profiles, item.user_id).name,
        user_avatar: extractUserFromProfile(item.profiles, item.user_id).avatar || '',
      }));

      setPosts(transformedItems);
      
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
  }, [user, options.includeArchived, options.onlyArchived, createAbortController]);

  // Load only archived posts
  const loadArchivedPosts = useCallback(async (currentUser = user) => {
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

      const transformedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        images: item.images,
        location: item.location,
        coordinates: item.coordinates,
        category: item.category,
        condition: item.condition,
        measurements: item.measurements,
        user_id: item.user_id,
        status: item.status,
        archived_at: item.archived_at,
        archived_reason: item.archived_reason,
        user_name: extractUserFromProfile(item.profiles, item.user_id).name,
        user_avatar: extractUserFromProfile(item.profiles, item.user_id).avatar || '',
      }));

      setPosts(transformedItems);
      
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
  }, [user, createAbortController]);

  // Load posts I'm interested in
  const loadInterestedPosts = useCallback(async (currentUser = user) => {
    if (!currentUser) {
      setPosts([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const signal = createAbortController();
      
      // First get all item IDs that the user has shown interest in
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('item_id')
        .eq('user_id', currentUser.id)
        .abortSignal(signal);
      
      if (signal.aborted) return;
      if (interestsError) throw interestsError;

      if (!interests.length) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      const itemIds = interests.map(interest => interest.item_id);
      
      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .in('id', itemIds)
        .order('created_at', { ascending: false })
        .abortSignal(signal);

      // Apply archive filter if specified
      if (options.onlyArchived) {
        query = query.not('archived_at', 'is', null);
      } else if (!options.includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data: items, error: itemsError } = await query;
      
      if (signal.aborted) return;
      if (itemsError) throw itemsError;

      const transformedItems = items.map(item => ({
        id: item.id,
        title: item.title,
        description: item.description,
        images: item.images,
        location: item.location,
        coordinates: item.coordinates,
        category: item.category,
        condition: item.condition,
        measurements: item.measurements,
        user_id: item.user_id,
        status: item.status,
        archived_at: item.archived_at,
        archived_reason: item.archived_reason,
        user_name: extractUserFromProfile(item.profiles, item.user_id).name,
        user_avatar: extractUserFromProfile(item.profiles, item.user_id).avatar || '',
      }));

      setPosts(transformedItems);
      
    } catch (err) {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        console.error('Error loading interested posts:', err);
        setError(err as Error);
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [user, options.includeArchived, options.onlyArchived, createAbortController]);

  // Cleanup function
  const cleanup = useCallback(() => {
    cancelPendingRequests();
  }, [cancelPendingRequests]);

  return {
    posts,
    isLoading,
    error,
    loadSavedPosts,
    loadMyPosts,
    loadArchivedPosts,
    loadInterestedPosts,
    cleanup
  };
}
