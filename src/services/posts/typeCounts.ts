
import { supabase } from "@/integrations/supabase/client";

export interface FeedTypeCounts {
  all: number;
  pifs: number;
  wishes: number;
}

const applyBaseFilter = (query: any, includeArchived: boolean, userId?: string) => {
  query = includeArchived
    ? query.in('pif_status', ['archived', 'completed'])
    : query
        .or('pif_status.is.null,and(pif_status.neq.archived,pif_status.neq.completed)')
        .is('archived_at', null);
  if (userId) query = query.eq('user_id', userId);
  return query;
};

/**
 * True item-type counts (all / pifs / wishes) scoped the same way as
 * getOptimizedPosts' base filter (archived boundary + optional author),
 * via lightweight `count: 'exact', head: true` queries — independent of
 * how many pages of the feed have actually been paginated in locally.
 *
 * Deliberately does not factor in the client-side distance filter (that
 * would require geo-aware counting server-side); these are the true
 * totals for the current archived/owner scope.
 */
export const fetchFeedTypeCounts = async (
  includeArchived: boolean,
  userId?: string,
): Promise<FeedTypeCounts> => {
  const [{ count: all, error: allError }, { count: wishes, error: wishesError }] =
    await Promise.all([
      applyBaseFilter(
        (supabase.from('items') as any).select('id', { count: 'exact', head: true }),
        includeArchived,
        userId,
      ),
      applyBaseFilter(
        (supabase.from('items') as any).select('id', { count: 'exact', head: true }),
        includeArchived,
        userId,
      ).eq('item_type', 'request'),
    ]);

  if (allError || wishesError) {
    throw allError || wishesError;
  }

  const totalCount = all ?? 0;
  const wishesCount = wishes ?? 0;
  return { all: totalCount, pifs: Math.max(0, totalCount - wishesCount), wishes: wishesCount };
};
