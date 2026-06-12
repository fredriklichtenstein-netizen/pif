
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
import {
  setCache,
  readCache,
  clearCacheByPrefix,
  FEED_CACHE_KEYS,
} from "./cache";

// Cache with TTL
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
// Persistent (sessionStorage) TTL — short, so a refresh or feed↔map switch
// reuses the result without serving stale data for long.
const PERSISTENT_TTL = 60 * 1000; // 60s
const STALE_REVALIDATE_TTL = 5 * 60 * 1000; // serve stale up to 5min while revalidating

// Create a memoized cache for transformed posts
const transformCache = memoryOptimizer.createMemoCache<Post>(50);

export const getOptimizedPosts = async (
  limit = 20,
  offset = 0,
  _retryAfterRecovery = false,
  includeArchived = false,
): Promise<Post[]> => {
  const start = performance.now();
  const archivedSuffix = includeArchived ? '-arch' : '';
  const cacheKey = `posts-v2-${limit}-${offset}${archivedSuffix}`;
  const persistentKey = `${FEED_CACHE_KEYS.optimizedPage(limit, offset)}${archivedSuffix}`;

  // 1) In-memory cache (fastest path, valid within current session).
  const cached = DatabaseCache.get<Post[]>(cacheKey);
  if (cached) {
    return cached;
  }

  // 2) Persistent (sessionStorage) cache survives full-page refreshes and
  // is shared across views, so switching feed↔map or hitting reload
  // doesn't re-execute the heavy joined query immediately.
  const persisted = readCache<Post[]>(persistentKey);
  if (persisted && !persisted.isStale) {
    // Re-warm the in-memory cache so subsequent reads stay O(1).
    DatabaseCache.set(cacheKey, persisted.data, CACHE_TTL);
    return persisted.data;
  }
  if (persisted && persisted.isStale && !_retryAfterRecovery) {
    // Stale-while-revalidate: hand back stale data immediately, refresh in bg.
    DatabaseCache.set(cacheKey, persisted.data, CACHE_TTL);
    void revalidateInBackground(limit, offset, includeArchived);
    return persisted.data;
  }
  try {
    // ---- Stage 1: items + profiles join ----
    const itemsStart = performance.now();
    const data = await OptimizedQueries.getPosts({ limit, offset, includeArchived });
    const itemsMs = performance.now() - itemsStart;
    performanceMetrics.recordStage('items-query', itemsMs, {
      count: String(Array.isArray(data) ? data.length : 0),
    });

    if (!data || !Array.isArray(data) || data.length === 0) {
      return [];
    }

    // ---- Stage 2: bulk interaction counts ----
    const itemIds = (data as any[]).map((item: any) => item.id);
    const countsStart = performance.now();
    const interactionsMap = await OptimizedQueries.getInteractionCounts(itemIds);
    const countsMs = performance.now() - countsStart;
    performanceMetrics.recordStage('interaction-counts', countsMs, {
      ids: String(itemIds.length),
    });

    // ---- Stage 3: transform (coordinate parsing, user extraction,
    // image array passthrough — no remote URL resolution today, but this
    // is where any media URL signing would land). ----
    const transformStart = performance.now();
    let imageCount = 0;
    const transformedPosts = (data as any[]).map((item: any) => {
      imageCount += Array.isArray(item.images) ? item.images.length : 0;
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
    const transformMs = performance.now() - transformStart;
    performanceMetrics.recordStage('transform', transformMs, {
      posts: String(transformedPosts.length),
      images: String(imageCount),
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

    // ---- Stage 4: cache writes (in-memory + sessionStorage) ----
    const cacheStart = performance.now();
    DatabaseCache.set(cacheKey, transformedPosts, CACHE_TTL);
    setCache(persistentKey, transformedPosts, PERSISTENT_TTL);
    const cacheMs = performance.now() - cacheStart;
    performanceMetrics.recordStage('cache-write', cacheMs);

    // ---- Roll-up + breakdown ----
    const totalMs = performance.now() - start;
    performanceMetrics.recordMetric({
      id: `posts-fetch-${Date.now()}`,
      name: 'api-request',
      value: totalMs,
      timestamp: Date.now(),
      category: 'network',
      tags: {
        type: 'posts-fetch',
        count: transformedPosts.length.toString(),
        items_ms: itemsMs.toFixed(0),
        counts_ms: countsMs.toFixed(0),
        transform_ms: transformMs.toFixed(0),
        cache_ms: cacheMs.toFixed(0),
      },
    });

    // Always emit a compact breakdown so the slowest stage is one line
    // away when investigating slow loads. The metrics collector itself
    // still flags individual stage outliers via its threshold checks.
    performanceMetrics.logBreakdown(
      'feed-fetch',
      totalMs,
      {
        items: itemsMs,
        counts: countsMs,
        transform: transformMs,
        cache: cacheMs,
      },
      { posts: String(transformedPosts.length), images: String(imageCount) },
    );

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

    // If a stale JWT is to blame, clear it and retry exactly once as
    // anon so the feed remains visible to logged-out viewers.
    if (!_retryAfterRecovery && isAuthInvalidError(error)) {
      maybeRecoverFromAuthError(error, "getOptimizedPosts");
      // Give the recovery a tick to wipe tokens before retrying.
      await new Promise((r) => setTimeout(r, 50));
      try {
        return await getOptimizedPosts(limit, offset, true);
      } catch {
        return [];
      }
    }

    throw error;
  }
};

// Prefetch next page with optimized queries
export const prefetchNextPage = (
  currentLimit: number,
  currentOffset: number,
  includeArchived = false,
) => {
  const nextOffset = currentOffset + currentLimit;
  const archivedSuffix = includeArchived ? '-arch' : '';
  const prefetchKey = `posts-${currentLimit}-${nextOffset}${archivedSuffix}`;

  // Only prefetch if not already cached
  if (!DatabaseCache.has(prefetchKey)) {
    getOptimizedPosts(currentLimit, nextOffset, false, includeArchived).catch(() => {
      // Ignore prefetch errors
    });
  }
};

// Clear cache when needed
export const clearPostsCache = () => {
  // Clear all posts-related cache entries
  DatabaseCache.clear();
  transformCache.clear();
  clearCacheByPrefix("posts:");
};

// Background revalidation used by the stale-while-revalidate path.
function revalidateInBackground(limit: number, offset: number, includeArchived = false) {
  const archivedSuffix = includeArchived ? '-arch' : '';
  // Drop the in-memory entry so the next call performs the real fetch,
  // then trigger it without awaiting the result.
  DatabaseCache.delete(`posts-v2-${limit}-${offset}${archivedSuffix}`);
  getOptimizedPosts(limit, offset, true, includeArchived).catch(() => {
    // ignore — we already returned stale data to the caller
  });
}
void STALE_REVALIDATE_TTL; // reserved for future tuning

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
