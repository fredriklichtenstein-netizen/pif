
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOptimizedPosts, prefetchNextPage } from '@/services/posts/optimized';
import { DEMO_MODE } from '@/config/demoMode';
import { MOCK_POSTS } from '@/data/mockPosts';
import type { Post } from '@/types/post';
import type { OperationType } from '@/hooks/feed/useOptimisticFeedUpdates';

const POSTS_PER_PAGE = 10;

// Duration of the fade-out animation before items are fully removed.
const FADE_DURATION_MS = 320;
// Duration of the fade-in animation when an item is undone/restored.
const RESTORE_FADE_MS = 400;

export function useOptimizedFeed() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();
  // Items currently animating out (still rendered, with fade-out class).
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  // Items fully removed (no longer rendered).
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  // Items animating back in after undo/restore.
  const [restoringIds, setRestoringIds] = useState<Set<string>>(new Set());
  // Pending fade timers, keyed by item id, so undo can cancel them.
  const fadeTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  // Pending fade-in timers so we can clear the class once the animation finishes.
  const restoreTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  // Listen for global delete/archive success events and animate items out locally.
  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId: string | number; operationType: OperationType }>).detail;
      if (!detail || !detail.itemId) return;
      const idStr = String(detail.itemId);

      if (detail.operationType === 'delete' || detail.operationType === 'archive') {
        // Mark as fading so the card animates out, then promote to removed.
        setFadingIds(prev => {
          if (prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.add(idStr);
          return next;
        });

        // Cancel any prior pending timer for this id.
        const existing = fadeTimersRef.current.get(idStr);
        if (existing) clearTimeout(existing);

        const timer = setTimeout(() => {
          setRemovedIds(prev => {
            const next = new Set(prev);
            next.add(idStr);
            return next;
          });
          setFadingIds(prev => {
            if (!prev.has(idStr)) return prev;
            const next = new Set(prev);
            next.delete(idStr);
            return next;
          });
          fadeTimersRef.current.delete(idStr);
        }, FADE_DURATION_MS);

        fadeTimersRef.current.set(idStr, timer);
      }

      if (detail.operationType === 'restore') {
        // Server-side restore — bring it back into view if it was optimistically removed.
        setRemovedIds(prev => {
          if (!prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        // Also invalidate the query cache so a brand-new restore (an item that
        // wasn't in the current cache because it was archived before page load)
        // actually reappears in the feed without a manual refresh.
        queryClient.invalidateQueries({ queryKey: ['posts', 'optimized'] });
      }
    };
    document.addEventListener('item-operation-success', handler as EventListener);

    // Undo handler — cancel any in-flight fade and re-show fully-removed items.
    const undoHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId: string | number }>).detail;
      if (!detail || !detail.itemId) return;
      const idStr = String(detail.itemId);

      const pending = fadeTimersRef.current.get(idStr);
      if (pending) {
        clearTimeout(pending);
        fadeTimersRef.current.delete(idStr);
      }

      setFadingIds(prev => {
        if (!prev.has(idStr)) return prev;
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });
      setRemovedIds(prev => {
        if (!prev.has(idStr)) return prev;
        const next = new Set(prev);
        next.delete(idStr);
        return next;
      });

      // Mark as restoring so the wrapper applies the fade-in class briefly.
      setRestoringIds(prev => {
        const next = new Set(prev);
        next.add(idStr);
        return next;
      });
      const existingRestore = restoreTimersRef.current.get(idStr);
      if (existingRestore) clearTimeout(existingRestore);
      const restoreTimer = setTimeout(() => {
        setRestoringIds(prev => {
          if (!prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        restoreTimersRef.current.delete(idStr);
      }, RESTORE_FADE_MS);
      restoreTimersRef.current.set(idStr, restoreTimer);
    };
    document.addEventListener('item-operation-undone', undoHandler as EventListener);

    return () => {
      document.removeEventListener('item-operation-success', handler as EventListener);
      document.removeEventListener('item-operation-undone', undoHandler as EventListener);
      // Clear any pending fade timers on unmount.
      fadeTimersRef.current.forEach(t => clearTimeout(t));
      fadeTimersRef.current.clear();
      restoreTimersRef.current.forEach(t => clearTimeout(t));
      restoreTimersRef.current.clear();
    };
  }, [queryClient]);

  // In demo mode, return mock data immediately
  const demoData = useMemo(() => {
    if (!DEMO_MODE) return null;
    return {
      posts: MOCK_POSTS as unknown as Post[],
      fadingIds: new Set<string>(),
      restoringIds: new Set<string>(),
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
    // Server is now authoritative; drop optimistic removals & in-flight fades.
    setRemovedIds(new Set());
    setFadingIds(new Set());
    setRestoringIds(new Set());
    fadeTimersRef.current.forEach(t => clearTimeout(t));
    fadeTimersRef.current.clear();
    restoreTimersRef.current.forEach(t => clearTimeout(t));
    restoreTimersRef.current.clear();
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
    fadingIds,
    restoringIds,
    isLoading: isLoading && page === 0,
    isLoadingMore: isLoading && page > 0,
    error,
    hasMore: !!hasMore,
    loadMore,
    refresh
  };
}
