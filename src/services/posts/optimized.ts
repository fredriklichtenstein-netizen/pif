
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types/post";
import { transformPostData } from "./transform";
import { OptimizedQueries, DatabaseCache } from "@/services/database";
import { performanceMetrics } from "@/services/performance/metrics";
import { memoryOptimizer } from "@/services/performance/memory";

// Cache with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Create a memoized cache for transformed posts
const transformCache = memoryOptimizer.createMemoCache<Post>(50);

export const getOptimizedPosts = async (limit = 20, offset = 0): Promise<Post[]> => {
  const start = performance.now();
  const cacheKey = `posts-${limit}-${offset}`;
  
  // TEMPORARILY DISABLE CACHE to debug the Anonymous user issue
  console.log(`🚫 DEBUGGING: Cache disabled, forcing fresh query for posts`);
  
  // Try cache first (DISABLED FOR DEBUGGING)
  // const cached = DatabaseCache.get<Post[]>(cacheKey);
  // if (cached) {
  //   console.log(`Cache hit for ${cacheKey}`);
  //   return cached;
  // }
  
  console.log(`Fetching optimized posts: limit=${limit}, offset=${offset}`);
  
  try {
    // Use optimized query
    const data = await OptimizedQueries.getPosts({ limit, offset });
    
    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // Get all interaction counts in a single batch
    const itemIds = data.map(item => item.id);
    const interactionsMap = await OptimizedQueries.getInteractionCounts(itemIds);

    // Transform all posts with memoization (DISABLED FOR DEBUGGING)
    const transformedPosts = data.map(item => {
      console.log(`🔍 DEBUGGING: About to transform item ${item.id}, profiles:`, item.profiles);
      
      // Disable transform cache for debugging
      // const cacheKey = `transform-${item.id}-${item.created_at}`;
      // const cached = transformCache.get(cacheKey);
      // if (cached) {
      //   return cached;
      // }
      
      const transformed = transformPostData(item, interactionsMap.get(item.id) || {
        likesCount: 0,
        interestsCount: 0,
        commentsCount: 0
      });
      
      console.log(`🔍 DEBUGGING: Transformed item ${item.id}, postedBy:`, transformed.postedBy);
      
      // transformCache.set(cacheKey, transformed);
      return transformed;
    });
    
    // Cache the results (DISABLED FOR DEBUGGING)
    // DatabaseCache.set(cacheKey, transformedPosts, CACHE_TTL);
    console.log(`🚫 DEBUGGING: Skipping cache to force fresh queries`);
    
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
    console.log(`🧹 Cleared transform cache (was ${cacheSize} entries)`);
  }
});

memoryOptimizer.addMemoryPressureHandler(() => {
  // Aggressive cleanup under memory pressure
  clearPostsCache();
  console.log('🧹 Cleared all caches due to memory pressure');
});
