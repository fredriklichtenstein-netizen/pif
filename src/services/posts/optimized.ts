
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types/post";
import { transformPostData } from "./transform";
import { OptimizedQueries, DatabaseCache } from "@/services/database";

// Cache with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getOptimizedPosts = async (limit = 20, offset = 0): Promise<Post[]> => {
  const cacheKey = `posts-${limit}-${offset}`;
  
  // Try cache first
  const cached = DatabaseCache.get<Post[]>(cacheKey);
  if (cached) {
    console.log(`Cache hit for ${cacheKey}`);
    return cached;
  }
  
  console.log(`Fetching optimized posts: limit=${limit}, offset=${offset}`);
  
  try {
    // Use optimized query
    const data = await OptimizedQueries.getPosts({ limit, offset });
    
    if (!data || data.length === 0) {
      return [];
    }

    // Get all interaction counts in a single batch
    const itemIds = data.map(item => item.id);
    const interactionsMap = await OptimizedQueries.getInteractionCounts(itemIds);

    // Transform all posts
    const transformedPosts = data.map(item => 
      transformPostData(item, interactionsMap.get(item.id) || {
        likesCount: 0,
        interestsCount: 0,
        commentsCount: 0
      })
    );
    
    // Cache the results
    DatabaseCache.set(cacheKey, transformedPosts, CACHE_TTL);
    
    return transformedPosts;
  } catch (error) {
    console.error("Error fetching optimized posts:", error);
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
};
