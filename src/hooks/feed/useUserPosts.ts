
import { useState, useEffect, useCallback } from 'react';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { usePostsBase, type UsePostsBaseOptions } from './posts/usePostsBase';
import { useSavedPosts } from './posts/useSavedPosts';
import { useUserPosts as useUserPostsHook } from './posts/useUserPosts';
import { useArchivedPosts } from './posts/useArchivedPosts';
import { useInterestedPosts } from './posts/useInterestedPosts';
import type { User } from '@supabase/supabase-js';

export function useUserPosts(options: UsePostsBaseOptions = {}) {
  const { user } = useGlobalAuth();
  const {
    posts,
    isLoading,
    error,
    cleanup
  } = usePostsBase(options);

  const { loadSavedPosts } = useSavedPosts(options);
  const { loadMyPosts } = useUserPostsHook(options);
  const { loadArchivedPosts } = useArchivedPosts();
  const { loadInterestedPosts } = useInterestedPosts(options);

  // Cleanup function
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    posts,
    isLoading,
    error,
    loadSavedPosts: (currentUser: User | null = user) => loadSavedPosts(currentUser),
    loadMyPosts: (currentUser: User | null = user) => loadMyPosts(currentUser),
    loadArchivedPosts: (currentUser: User | null = user) => loadArchivedPosts(currentUser),
    loadInterestedPosts: (currentUser: User | null = user) => loadInterestedPosts(currentUser),
    cleanup
  };
}
