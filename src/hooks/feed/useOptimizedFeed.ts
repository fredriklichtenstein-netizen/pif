
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOptimizedPosts, prefetchNextPage, clearPostsCache } from '@/services/posts/optimized';
import { supabase } from '@/integrations/supabase/client';
import { DEMO_MODE } from '@/config/demoMode';
import { MOCK_POSTS } from '@/data/mockPosts';
import { useInitialCountsStore } from '@/stores/initialCountsStore';
import type { Post } from '@/types/post';
import type { OperationType } from '@/hooks/feed/useOptimisticFeedUpdates';
import { isSafeMode } from '@/utils/safeMode';

// Smaller first page = faster cold paint. Subsequent pages use a
// larger size to reduce round-trips while scrolling.
const FIRST_PAGE_SIZE = 6;
const POSTS_PER_PAGE = 10;
const pageSize = (page: number) => (page === 0 ? FIRST_PAGE_SIZE : POSTS_PER_PAGE);
const offsetForPage = (page: number) =>
  page === 0 ? 0 : FIRST_PAGE_SIZE + (page - 1) * POSTS_PER_PAGE;

// Duration of the fade-out animation before items are fully removed.
const FADE_DURATION_MS = 320;
// Duration of the fade-in animation when an item is undone/restored.
const RESTORE_FADE_MS = 400;

const removePostFromActiveCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  itemId: string,
) => {
  queryClient.setQueriesData<Post[]>(
    {
      predicate: (query) =>
        query.queryKey[0] === 'posts' &&
        query.queryKey[1] === 'optimized' &&
        query.queryKey[3] === false,
    },
    (old) => old?.filter((post) => String(post.id) !== itemId) ?? old,
  );
};

const removePostFromArchivedCache = (
  queryClient: ReturnType<typeof useQueryClient>,
  itemId: string,
) => {
  queryClient.setQueriesData<Post[]>(
    {
      predicate: (query) =>
        query.queryKey[0] === 'posts' &&
        query.queryKey[1] === 'optimized' &&
        query.queryKey[3] === true,
    },
    (old) => old?.filter((post) => String(post.id) !== itemId) ?? old,
  );
};

const invalidateOptimizedFeedQueries = (
  queryClient: ReturnType<typeof useQueryClient>,
) => {
  queryClient.invalidateQueries({
    predicate: (query) =>
      query.queryKey[0] === 'posts' && query.queryKey[1] === 'optimized',
  });
};

export function useOptimizedFeed(options: { includeArchived?: boolean } = {}) {
  const includeArchived = !!options.includeArchived;
  const [page, setPage] = useState(0);
  // Bumped for every archive/restore realtime event. This makes React Query
  // create a fresh feed query instead of relying on invalidating an older key,
  // which could be left stale across repeated archive/restore cycles.
  const [feedVersion, setFeedVersion] = useState(0);
  const queryClient = useQueryClient();
  // Items currently animating out (still rendered, with fade-out class).
  const [fadingIds, setFadingIds] = useState<Set<string>>(new Set());
  // Items fully removed everywhere (hard delete).
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  // Items archived during this session and hidden only from the active feed.
  const [activeArchivedIds, setActiveArchivedIds] = useState<Set<string>>(new Set());
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

      if (detail.operationType === 'delete' || (detail.operationType === 'archive' && !includeArchived)) {
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
          const setHiddenIds = detail.operationType === 'delete' ? setRemovedIds : setActiveArchivedIds;
          setHiddenIds(prev => {
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

        // Also wipe the secondary in-memory/session DatabaseCache used by getOptimizedPosts.
        clearPostsCache();
        if (detail.operationType === 'archive' && !includeArchived) {
          removePostFromActiveCache(queryClient, idStr);
        }
        setPage(0);
        setFeedVersion((version) => version + 1);
        invalidateOptimizedFeedQueries(queryClient);
      }

      if (detail.operationType === 'restore') {
        // Server-side restore — bring it back into view if it was optimistically removed.
        setRemovedIds(prev => {
          if (!prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        setActiveArchivedIds(prev => {
          if (!prev.has(idStr)) return prev;
          const next = new Set(prev);
          next.delete(idStr);
          return next;
        });
        // Clear the secondary cache so a fresh fetch can return the restored item.
        clearPostsCache();
        setPage(0);
        setFeedVersion((version) => version + 1);
        // Trigger a fresh fetch.
        invalidateOptimizedFeedQueries(queryClient);
      }
    };
    document.addEventListener('item-operation-success', handler as EventListener);

    // Undo handler — cancel any in-flight fade and re-show fully-removed items.
    const undoHandler = (event: Event) => {
      const detail = (event as CustomEvent<{ itemId: string | number; operationType?: OperationType }>).detail;
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
      setActiveArchivedIds(prev => {
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
  }, [queryClient, includeArchived]);




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
    queryKey: ['posts', 'optimized', page, includeArchived, feedVersion],
    queryFn: () => getOptimizedPosts(pageSize(page), offsetForPage(page), false, includeArchived),
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
      const pageData = queryClient.getQueryData<Post[]>(['posts', 'optimized', i, includeArchived, feedVersion]);
      if (pageData) {
        posts.push(...pageData);
      }
    }
    const isTerminal = (s: any) => s === 'archived' || s === 'completed';
    return posts.filter((p) => {
      const id = String(p.id);
      if (removedIds.has(id)) return false;
      // Both 'archived' and 'completed' are terminal for feed visibility —
      // completed handoffs live in the Archived/Completed tab. Mirror the
      // helper used by services/posts/optimized.ts so a stale cached page
      // can't leak a completed row back into the active feed.
      const isArchivedPost =
        isTerminal((p as any).status) ||
        isTerminal((p as any).pif_status) ||
        !!p.archived_at;
      if (includeArchived) return isArchivedPost;
      if (isArchivedPost) return false;
      if (!includeArchived && activeArchivedIds.has(id)) return false;
      return true;
    });
  }, [page, queryClient, currentPageData, removedIds, activeArchivedIds, includeArchived, feedVersion]);

  const visiblePostIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    visiblePostIdsRef.current = new Set(allPosts.map((post) => String(post.id)));
  }, [allPosts]);

  // Load more posts. Uses a ref-guarded functional updater so rapid
  // back-to-back intersection events from InfiniteScrollSentinel
  // (which fires again the moment its observer is re-created with a
  // fresh `isLoading=false` closure) cannot skip a page. Without this,
  // two calls landing across React commits jump `page` by 2 and the
  // in-between offset is never fetched — leaving the feed appearing
  // stuck with skeletons that never resolve to real posts.
  const loadMoreInFlightRef = useRef(false);
  const loadMore = useCallback(() => {
    if (DEMO_MODE) return;
    if (loadMoreInFlightRef.current) return;
    loadMoreInFlightRef.current = true;
    setPage((prev) => {
      const nextPage = prev + 1;
      setTimeout(() => {
        prefetchNextPage(pageSize(nextPage + 1), offsetForPage(nextPage + 1), includeArchived);
      }, 100);
      return nextPage;
    });
  }, [includeArchived]);

  // Release the in-flight guard once the new page has finished loading
  // so the next intersection can trigger the page after it.
  useEffect(() => {
    if (!isLoading) {
      loadMoreInFlightRef.current = false;
    }
  }, [isLoading, page]);

  // Refresh all data
  const refresh = useCallback(async () => {
    if (DEMO_MODE) return;
    // Clear all cached queries
    clearPostsCache();
    setPage(0);
    await refetch();
    // Server is now authoritative; drop optimistic removals & in-flight fades.
    setRemovedIds(new Set());
    setActiveArchivedIds(new Set());
    setFadingIds(new Set());
    setRestoringIds(new Set());
    fadeTimersRef.current.forEach(t => clearTimeout(t));
    fadeTimersRef.current.clear();
    restoreTimersRef.current.forEach(t => clearTimeout(t));
    restoreTimersRef.current.clear();
    loadMoreInFlightRef.current = false;
  }, [queryClient, refetch]);

  // Prefetch next page on mount and when page changes
  useEffect(() => {
    if (DEMO_MODE) return;
    const timer = setTimeout(() => {
      prefetchNextPage(pageSize(page + 1), offsetForPage(page + 1), includeArchived);
    }, 1000);

    return () => clearTimeout(timer);
  }, [page, includeArchived]);

  // Feed-level realtime only: one shared channel for new items and visible
  // interaction-count changes. Item cards must never open per-card channels.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (isSafeMode()) return;

    // Debounced, authoritative HEAD COUNT refresh per item+table. Using
    // an absolute count from the DB (instead of a +/-1 delta) keeps the
    // store correct even when our own optimistic update has already been
    // applied and the realtime echo arrives moments later — avoiding the
    // double-decrement that previously left counters showing stale values.
    const pendingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    const refreshCount = (
      itemId: string,
      table: 'likes' | 'interests',
      countKey: 'likesCount' | 'interestsCount',
    ) => {
      const key = `${table}:${itemId}`;
      const existing = pendingTimers.get(key);
      if (existing) clearTimeout(existing);
      pendingTimers.set(
        key,
        setTimeout(async () => {
          pendingTimers.delete(key);
          try {
            const numericId = parseInt(itemId, 10);
            if (Number.isNaN(numericId)) return;
            const { count, error } = await supabase
              .from(table)
              .select('item_id', { count: 'exact', head: true })
              .eq('item_id', numericId);
            if (error || typeof count !== 'number') return;
            useInitialCountsStore
              .getState()
              .setBulkCounts([{ itemId, [countKey]: count }]);
          } catch {
            /* best-effort */
          }
        }, 250),
      );
    };

    const handleInteraction = (
      table: 'likes' | 'interests',
      countKey: 'likesCount' | 'interestsCount',
      payload: { eventType?: string; new?: any; old?: any },
    ) => {
      if (
        payload.eventType !== 'INSERT' &&
        payload.eventType !== 'DELETE'
      )
        return;
      const row = payload.new ?? payload.old;
      const itemId = row?.item_id != null ? String(row.item_id) : '';
      if (!itemId || !visiblePostIdsRef.current.has(itemId)) return;
      refreshCount(itemId, table, countKey);
    };

    const channel = supabase
      .channel(`feed-shared-realtime-${includeArchived ? 'arch' : 'active'}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'items' },
        () => {
          clearPostsCache();
          setRemovedIds((prev) => (prev.size === 0 ? prev : new Set()));
          setActiveArchivedIds((prev) => (prev.size === 0 ? prev : new Set()));
          invalidateOptimizedFeedQueries(queryClient);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'items' },
        (payload: any) => {
          const newStatus = payload?.new?.pif_status;
          const oldStatus = payload?.old?.pif_status;
          // React to any transition that moves an item off (or back onto) the
          // active feed. Both 'archived' and 'completed' are terminal for feed
          // visibility — completed items live in the Archived/Completed tab.
          // `old` may be missing if REPLICA IDENTITY isn't FULL, so we also
          // treat a present 'archived'/'completed'/'active' status as actionable.
          const isTerminal = (s: any) => s === 'archived' || s === 'completed';
          const archivedChanged =
            (oldStatus !== undefined && newStatus !== oldStatus &&
              (isTerminal(newStatus) || isTerminal(oldStatus))) ||
            (oldStatus === undefined &&
              (isTerminal(newStatus) || newStatus === 'active'));
          if (!archivedChanged) return;
          clearPostsCache();
          const itemId = payload?.new?.id ?? payload?.old?.id;
          if (itemId != null) {
            const idStr = String(itemId);
            if (isTerminal(newStatus)) {
              removePostFromActiveCache(queryClient, idStr);
              if (!includeArchived) {
                setActiveArchivedIds((prev) => {
                  if (prev.has(idStr)) return prev;
                  const next = new Set(prev);
                  next.add(idStr);
                  return next;
                });
              }
            } else {
              removePostFromArchivedCache(queryClient, idStr);
              setRemovedIds((prev) => {
                if (!prev.has(idStr)) return prev;
                const next = new Set(prev);
                next.delete(idStr);
                return next;
              });
              setActiveArchivedIds((prev) => {
                if (!prev.has(idStr)) return prev;
                const next = new Set(prev);
                next.delete(idStr);
                return next;
              });
            }
          }
          setPage(0);
          setFeedVersion((version) => version + 1);
          invalidateOptimizedFeedQueries(queryClient);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'likes' },
        (payload) => handleInteraction('likes', 'likesCount', payload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'interests' },
        (payload) => handleInteraction('interests', 'interestsCount', payload)
      )
      .subscribe();
    return () => {
      pendingTimers.forEach((t) => clearTimeout(t));
      pendingTimers.clear();
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
    };
  }, [queryClient, includeArchived]);

  // Return demo data if in demo mode
  if (demoData) {
    return demoData;
  }

  const hasMore = currentPageData && currentPageData.length === pageSize(page);

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
