
import type { Post } from "@/types/post";

const CACHE_KEY = 'posts_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes

export const getPostsFromCache = (): Post[] | null => {
  if (typeof window === 'undefined') return null;
  
  const cachedData = localStorage.getItem(CACHE_KEY);
  if (!cachedData) return null;
  
  try {
    const { data, timestamp } = JSON.parse(cachedData);
    const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
    
    return isExpired ? null : data;
  } catch (e) {
    console.warn("Failed to parse cached posts data", e);
    return null;
  }
};

export const cachePostsData = (data: Post[]) => {
  if (typeof window === 'undefined') return;
  
  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};
