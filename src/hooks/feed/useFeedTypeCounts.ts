import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { fetchFeedTypeCounts, type FeedTypeCounts } from "@/services/posts/typeCounts";

const EMPTY: FeedTypeCounts = { all: 0, pifs: 0, wishes: 0 };

/**
 * True feed type counts (all/pifs/wishes), independent of how many pages
 * have been paginated in locally — see fetchFeedTypeCounts. Kept fresh via
 * a debounced refetch on any items INSERT/UPDATE (covers new posts and
 * archive/restore transitions moving items between buckets).
 */
export const useFeedTypeCounts = (includeArchived: boolean, userId?: string) => {
  const [counts, setCounts] = useState<FeedTypeCounts>(EMPTY);
  const [isLoaded, setIsLoaded] = useState(false);

  const refetch = useCallback(async () => {
    if (DEMO_MODE) {
      setIsLoaded(true);
      return;
    }
    try {
      const next = await fetchFeedTypeCounts(includeArchived, userId);
      setCounts(next);
    } catch (err) {
      console.warn("[useFeedTypeCounts] fetch failed", err);
    } finally {
      setIsLoaded(true);
    }
  }, [includeArchived, userId]);

  useEffect(() => {
    setIsLoaded(false);
    refetch();
  }, [refetch]);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (DEMO_MODE) return;
    const scheduleRefetch = () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(refetch, 300);
    };
    const channel = supabase
      .channel(`feed-type-counts-${includeArchived ? 'arch' : 'active'}-${userId ?? 'all'}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'items' }, scheduleRefetch)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'items' }, scheduleRefetch)
      .subscribe();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      try {
        supabase.removeChannel(channel);
      } catch {
        /* noop */
      }
    };
  }, [includeArchived, userId, refetch]);

  return { counts, isLoaded };
};
