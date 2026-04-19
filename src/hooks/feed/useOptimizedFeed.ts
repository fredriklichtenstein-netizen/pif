
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOptimizedPosts, prefetchNextPage } from '@/services/posts/optimized';
import { DEMO_MODE } from '@/config/demoMode';
import { MOCK_POSTS } from '@/data/mockPosts';
import type { Post } from '@/types/post';
import type { OperationType } from '@/hooks/feed/useOptimisticFeedUpdates';

const POSTS_PER_PAGE = 10;

export function useOptimizedFeed() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  // Optimistic removals for delete/archive ops — instantly hide items in the feed.
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());

  // Listen for global delete/archive success events and remove items locally.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId: string | number; operationType: OperationType }>).detail;
      if (!detail || !detail.itemId) return;
      if (detail.operationType === 'delete' || detail.operationType === 'archive') {
        setRemovedIds(prev => {
          const next = new Set(prev);
          next.add(String(detail.itemId));
          return next;
        });
      }
      if (detail.operationType === 'restore') {
        setRemovedIds(prev => {
          if (!prev.has(String(detail.itemId))) return prev;
          const next = new Set(prev);
          next.delete(String(detail.itemId));
          return next;
        });
      }
    };
    document.addEventListener('item-operation-success', handler as EventListener);

    // Undo handler — re-show items that were optimistically removed.
    const undoHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId: string | number }>).detail;
      if (!detail || !detail.itemId) return;
      setRemovedIds(prev => {
        if (!prev.has(String(detail.itemId))) return prev;
        const next = new Set(prev);
        next.delete(String(detail.itemId));
        return next;
      });
    };
    document.addEventListener('item-operation-undone', undoHandler as EventListener);

    return () => {
      document.removeEventListener('item-operation-success', handler as EventListener);
      document.removeEventListener('item-operation-undone', undoHandler as EventListener);
    };
  }, []);

  // In demo mode, return mock data immediately
  const demoData = useMemo(() => {
    if (!DEMO_MODE) return null;
    return {
      posts: MOCK_POSTS as unknown as Post[],
      isLoading: false,
      isLoadingMore: false,
      error: null,
      hasMore: false,
      loadMore: () => {},
      refresh: async () => {}
    };
  }, []);

  // Main posts query with React Query for caching and deduplication
  const {
    data: currentPageData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['posts', 'optimized', page],
    queryFn: () => getOptimizedPosts(POSTS_PER_PAGE, page * POSTS_PER_PAGE),
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
    retry: 2,
    enabled: !DEMO_MODE // Skip query in demo mode
  });

  // Aggregate all pages of posts, then strip optimistically-removed items.
  const allPosts = useMemo(() => {
    if (DEMO_MODE) return [];
    const posts: Post[] = [];
    for (let i = 0; i <= page; i++) {
      const pageData = queryClient.getQueryData<Post[]>(['posts', 'optimized', i]);
      if (pageData) {
        posts.push(...pageData);
      }
    }
    if (removedIds.size === 0) return posts;
    return posts.filter(p => !removedIds.has(String(p.id)));
  }, [page, queryClient, currentPageData, removedIds]);

  // Load more posts
  const loadMore = useCallback(() => {
    if (DEMO_MODE) return;
    const nextPage = page + 1;
    setPage(nextPage);
    
    // Prefetch the page after next
    setTimeout(() => {
      prefetchNextPage(POSTS_PER_PAGE, (nextPage + 1) * POSTS_PER_PAGE);
    }, 100);
  }, [page]);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (DEMO_MODE) return;
    // Clear all cached queries
    queryClient.removeQueries({ queryKey: ['posts', 'optimized'] });
    setPage(0);
    await refetch();
    // Server is now authoritative; drop optimistic removals.
    setRemovedIds(new Set());
  }, [queryClient, refetch]);

  // Prefetch next page on mount and when page changes
  useEffect(() => {
    if (DEMO_MODE) return;
    const timer = setTimeout(() => {
      prefetchNextPage(POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [page]);

  // Return demo data if in demo mode
  if (demoData) {
    return demoData;
  }

  const hasMore = currentPageData && currentPageData.length === POSTS_PER_PAGE;

  return {
    posts: allPosts,
    isLoading: isLoading && page === 0,
    isLoadingMore: isLoading && page > 0,
    error,
    hasMore: !!hasMore,
    loadMore,
    refresh
  };
}
