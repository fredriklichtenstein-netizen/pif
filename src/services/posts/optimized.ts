
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types/post";
import { transformPostData } from "./transform";
import { fetchAllInteractionCounts } from "./interactions";

// Cache with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, { data: any; timestamp: number; promise?: Promise<any> }>();

const isExpired = (timestamp: number) => Date.now() - timestamp > CACHE_TTL;

// Enhanced cache with promise deduplication
const getCachedData = <T>(key: string, fetcher: () => Promise<T>): Promise<T> => {
  const cached = cache.get(key);
  
  if (cached && !isExpired(cached.timestamp)) {
    return Promise.resolve(cached.data);
  }
  
  if (cached?.promise) {
    return cached.promise;
  }
  
  const promise = fetcher().then(data => {
    cache.set(key, { data, timestamp: Date.now() });
    return data;
  }).catch(error => {
    cache.delete(key);
    throw error;
  });
  
  cache.set(key, { data: null, timestamp: Date.now(), promise });
  return promise;
};

export const getOptimizedPosts = async (limit = 20, offset = 0): Promise<Post[]> => {
  const cacheKey = `posts-${limit}-${offset}`;
  
  return getCachedData(cacheKey, async () => {
    console.log(`Fetching optimized posts: limit=${limit}, offset=${offset}`);
    
    // Single query for posts with user data
    const { data, error } = await supabase
      .from('items')
      .select(`
        id, title, description, images, location, coordinates, category, 
        condition, measurements, user_id, status, archived_at, archived_reason, created_at,
        profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)
      `)
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get all interaction counts in a single batch
    const itemIds = data.map(item => item.id);
    const interactionsMap = await fetchAllInteractionCounts(itemIds);

    // Transform all posts
    return data.map(item => 
      transformPostData(item, interactionsMap.get(item.id) || {
        likesCount: 0,
        interestsCount: 0,
        commentsCount: 0
      })
    );
  });
};

// Prefetch next page
export const prefetchNextPage = (currentLimit: number, currentOffset: number) => {
  const nextOffset = currentOffset + currentLimit;
  const prefetchKey = `posts-${currentLimit}-${nextOffset}`;
  
  // Only prefetch if not already cached
  if (!cache.has(prefetchKey)) {
    getOptimizedPosts(currentLimit, nextOffset).catch(() => {
      // Ignore prefetch errors
    });
  }
};
