
import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOptimizedPosts, prefetchNextPage } from '@/services/posts/optimized';
import type { Post } from '@/types/post';

const POSTS_PER_PAGE = 10;

export function useOptimizedFeed() {
  const [page, setPage] = useState(0);
  const queryClient = useQueryClient();

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
    retry: 2
  });

  // Aggregate all pages of posts
  const allPosts = useMemo(() => {
    const posts: Post[] = [];
    for (let i = 0; i <= page; i++) {
      const pageData = queryClient.getQueryData<Post[]>(['posts', 'optimized', i]);
      if (pageData) {
        posts.push(...pageData);
      }
    }
    return posts;
  }, [page, queryClient, currentPageData]);

  // Load more posts
  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    
    // Prefetch the page after next
    setTimeout(() => {
      prefetchNextPage(POSTS_PER_PAGE, (nextPage + 1) * POSTS_PER_PAGE);
    }, 100);
  }, [page]);

  // Refresh all data
  const refresh = useCallback(async () => {
    // Clear all cached queries
    queryClient.removeQueries({ queryKey: ['posts', 'optimized'] });
    setPage(0);
    await refetch();
  }, [queryClient, refetch]);

  // Prefetch next page on mount and when page changes
  useEffect(() => {
    const timer = setTimeout(() => {
      prefetchNextPage(POSTS_PER_PAGE, (page + 1) * POSTS_PER_PAGE);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [page]);

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
