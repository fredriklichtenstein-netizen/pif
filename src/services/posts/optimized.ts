
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types/post";
import { transformPostData } from "./transform";
import { OptimizedQueries, DatabaseCache } from "@/services/database";
import { performanceMetrics } from "@/services/performance/metrics";
import { memoryOptimizer } from "@/services/performance/memory";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import {
  isAuthInvalidError,
  maybeRecoverFromAuthError,
} from "@/hooks/auth/sessionRecovery";

// Cache with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create a memoized cache for transformed posts
const transformCache = memoryOptimizer.createMemoCache<Post>(50);

export const getOptimizedPosts = async (
  limit = 20,
  offset = 0,
  _retryAfterRecovery = false,
): Promise<Post[]> => {
  const start = performance.now();
  const cacheKey = `posts-v2-${limit}-${offset}`;
  
  // Try cache first
  const cached = DatabaseCache.get<Post[]>(cacheKey);
  if (cached) {
    return cached;
  }
  try {
    // Use optimized query
    const data = await OptimizedQueries.getPosts({ limit, offset });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Get all interaction counts in a single batch
    const itemIds = (data as any[]).map((item: any) => item.id);
    const interactionsMap = await OptimizedQueries.getInteractionCounts(itemIds);

    // Transform all posts with memoization
    const transformedPosts = (data as any[]).map((item: any) => {
      const cacheKey = `transform-v2-${item.id}-${item.created_at}`;
      const cached = transformCache.get(cacheKey);
      if (cached) {
        return cached;
      }
      
      const transformed = transformPostData(item, interactionsMap.get(item.id) || {
        likesCount: 0,
        interestsCount: 0,
        commentsCount: 0
      });
      
      transformCache.set(cacheKey, transformed);
      return transformed;
    });

    // Seed the global initial counts store so feed cards show correct
    // counters (likes/comments/interests) immediately on first render.
    try {
      const entries: Array<{ itemId: string | number; likesCount: number; commentsCount: number; interestsCount: number }> = [];
      interactionsMap.forEach((value: any, key: any) => {
        entries.push({
          itemId: key,
          likesCount: Number(value.likesCount) || 0,
          commentsCount: Number(value.commentsCount) || 0,
          interestsCount: Number(value.interestsCount) || 0,
        });
      });
      if (entries.length > 0) {
        useInitialCountsStore.getState().setBulkCounts(entries);
      }
    } catch {
      // Non-fatal — counts will still load lazily.
    }

    // Cache the results
    DatabaseCache.set(cacheKey, transformedPosts, CACHE_TTL);
    // Record performance metrics
    performanceMetrics.recordMetric({
      id: `posts-fetch-${Date.now()}`,
      name: 'api-request',
      value: performance.now() - start,
      timestamp: Date.now(),
      category: 'network',
      tags: { 
        type: 'posts-fetch',
        count: transformedPosts.length.toString()
      }
    });
    
    return transformedPosts;
  } catch (error) {
    console.error("Error fetching optimized posts:", error);
    
    performanceMetrics.recordMetric({
      id: `posts-error-${Date.now()}`,
      name: 'api-error',
      value: performance.now() - start,
      timestamp: Date.now(),
      category: 'network',
      tags: { 
        type: 'posts-fetch-error',
        error: error instanceof Error ? error.message : 'unknown'
      }
    });
    
    throw error;
  }
};

// Prefetch next page with optimized queries
export const prefetchNextPage = (currentLimit: number, currentOffset: number) => {
  const nextOffset = currentOffset + currentLimit;
  const prefetchKey = `posts-${currentLimit}-${nextOffset}`;
  
  // Only prefetch if not already cached
  if (!DatabaseCache.has(prefetchKey)) {
    getOptimizedPosts(currentLimit, nextOffset).catch(() => {
      // Ignore prefetch errors
    });
  }
};

// Clear cache when needed
export const clearPostsCache = () => {
  // Clear all posts-related cache entries
  DatabaseCache.clear();
  transformCache.clear();
};

// Register cleanup tasks for memory management
memoryOptimizer.addCleanupTask(() => {
  // Clear old cache entries
  const cacheSize = transformCache.size();
  if (cacheSize > 30) {
    transformCache.clear();
  }
});

memoryOptimizer.addMemoryPressureHandler(() => {
  // Aggressive cleanup under memory pressure
  clearPostsCache();
});
