
import type { Post } from "@/types/post";

const CACHE_KEY = 'posts_cache';
const CACHE_EXPIRY = 5 * 60 * 1000; // 5 minutes in milliseconds

export function getPostsFromCache(): Post[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const cachedData = localStorage.getItem(CACHE_KEY);
  if (!cachedData) {
    return null;
  }

  try {
    const { data, timestamp } = JSON.parse(cachedData);
    const isExpired = Date.now() - timestamp > CACHE_EXPIRY;
    
    if (isExpired) {
      return null;
    }

    console.log("Using cached posts data");
    return data;
  } catch (e) {
    console.warn("Failed to parse cached data", e);
    return null;
  }
}

export function cachePostsData(data: Post[]): void {
  if (typeof window === 'undefined') {
    return;
  }

  localStorage.setItem(CACHE_KEY, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
}
