
import { supabase } from "@/integrations/supabase/client";
import { withRetry, DatabaseError } from "./connection";
import { monitorQuery } from "./monitor";

// Optimized query builders with monitoring
export class OptimizedQueries {
  private static interactionCountsRpcAvailable = true;

  // Get posts with optimized joins and filtering
  static async getPosts(options: {
    limit?: number;
    offset?: number;
    userId?: string;
    categories?: string[];
    coordinates?: { lat: number; lng: number; radius?: number };
    includeArchived?: boolean;
  }) {
    return monitorQuery('getPosts', () =>
      withRetry(async () => {
        // Narrow column list — only what feed cards / transform actually read.
        // Avoid heavy fields like `measurements`, `archived_reason`,
        // `pickup_*`, etc. Profiles are fetched in a separate parallel query
        // to keep PostgREST off the embed path (which has been observed to
        // stall under load and silently fall through on permission edges).
        let query = (supabase
          .from('items') as any)
          .select(`
            id, title, description, images, location, coordinates,
            category, condition, user_id, pif_status, item_type,
            created_at, archived_at, archived_reason
          `);

        if (options.includeArchived) {
          query = query
            .eq('pif_status', 'archived')
            .order('archived_at', { ascending: false, nullsFirst: false });
        } else {
          query = query
            .not('pif_status', 'eq', 'archived')
            .order('created_at', { ascending: false });
        }

        if (options.categories?.length) {
          query = query.in('category', options.categories);
        }

        if (options.userId) {
          query = query.eq('user_id', options.userId);
        }

        if (options.limit) {
          query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
        }

        // Start profiles at the same time as items. This intentionally avoids
        // PostgREST embeds and avoids waiting for the items response before
        // beginning the profile request.
        const profilesQuery = supabase
          .from('profiles')
          .select('id, first_name, last_name, username, avatar_url');

        const [{ data, error }, { data: profiles, error: profilesError }] = await Promise.all([
          query,
          profilesQuery,
        ]);
        if (error) {
          console.error('🚨 CRITICAL: Database query failed:', error);
          throw new DatabaseError('Failed to fetch posts', error.code, error);
        }

        if (!data || data.length === 0) {
          return [];
        }

        let profilesById = new Map<string, any>();
        if (profilesError) {
          console.warn('Profiles fetch failed (non-fatal):', profilesError);
        } else if (profiles) {
          profilesById = new Map(profiles.map((p: any) => [p.id, p]));
        }

        return (data as any[]).map((row: any) => ({
          ...row,
          profiles: profilesById.get(row.user_id) || null,
        }));
      })
    );
  }


  // Batch get interaction counts for multiple items
  static async getInteractionCounts(itemIds: number[]) {
    return monitorQuery('getInteractionCounts', () =>
      withRetry(async () => {
        if (itemIds.length === 0) return new Map();

        if (!this.interactionCountsRpcAvailable) {
          return this.getInteractionCountsFallback(itemIds);
        }
        
        try {
          // Use our optimized RPC function. Live function signature uses
          // `p_item_ids`; older deployments accepted `item_ids`.
          let { data, error } = await (supabase.rpc as any)('get_bulk_interaction_counts', {
            p_item_ids: itemIds,
          });
          if (error && (error.code === 'PGRST202' || /item_ids/.test(error.message || ''))) {
            const fallback = await (supabase.rpc as any)('get_bulk_interaction_counts', {
              item_ids: itemIds,
            });
            data = fallback.data;
            error = fallback.error;
          }
          if (error) throw error;
          
          const countsMap = new Map();
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              if (item && typeof item === 'object' && 'item_id' in item) {
                countsMap.set(Number(item.item_id), {
                  likesCount: Number(item.likes_count) || 0,
                  interestsCount: Number(item.interests_count) || 0,
                  commentsCount: Number(item.comments_count) || 0
                });
              }
            });
          }
          
          return countsMap;
        } catch (error) {
          if (error instanceof Error === false && typeof error === 'object' && error && 'code' in error && error.code === 'PGRST202') {
            this.interactionCountsRpcAvailable = false;
            console.warn('Bulk interaction counts RPC unavailable, using fallback queries instead.');
          } else {
            console.error('Bulk interaction counts failed:', error);
          }
          // Fallback to individual queries with batching
          return await this.getInteractionCountsFallback(itemIds);
        }
      })
    );
  }

  private static async getInteractionCountsFallback(itemIds: number[]) {
    const [likes, interests, comments] = await Promise.all([
      supabase.from('likes').select('item_id').in('item_id', itemIds),
      supabase.from('interests').select('item_id').in('item_id', itemIds),
      supabase.from('comments').select('item_id').in('item_id', itemIds)
    ]);
    
    const countsMap = new Map();
    const likesCounts = new Map<number, number>();
    const interestsCounts = new Map<number, number>();
    const commentsCounts = new Map<number, number>();

    likes.data?.forEach((row: any) => {
      const itemId = Number(row.item_id);
      likesCounts.set(itemId, (likesCounts.get(itemId) || 0) + 1);
    });
    interests.data?.forEach((row: any) => {
      const itemId = Number(row.item_id);
      interestsCounts.set(itemId, (interestsCounts.get(itemId) || 0) + 1);
    });
    comments.data?.forEach((row: any) => {
      const itemId = Number(row.item_id);
      commentsCounts.set(itemId, (commentsCounts.get(itemId) || 0) + 1);
    });
    
    itemIds.forEach(itemId => {
      countsMap.set(itemId, {
        likesCount: likesCounts.get(itemId) || 0,
        interestsCount: interestsCounts.get(itemId) || 0,
        commentsCount: commentsCounts.get(itemId) || 0,
      });
    });
    
    return countsMap;
  }

  // Get user profile with caching
  static async getUserProfile(userId: string) {
    return monitorQuery('getUserProfile', () =>
      withRetry(async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (error) {
          throw new DatabaseError('Failed to fetch user profile', error.code, error);
        }
        
        return data;
      })
    );
  }

  // Optimized comments query
  static async getComments(itemId: number, limit = 20, offset = 0) {
    return monitorQuery('getComments', () =>
      withRetry(async () => {
        const { data, error } = await supabase
          .from('comments')
          .select(`
            id, content, created_at, parent_id,
            profiles!comments_user_id_fkey(id, first_name, last_name, username, avatar_url)
          `)
          .eq('item_id', itemId)
          .order('created_at', { ascending: false })
          .range(offset, offset + limit - 1);
          
        if (error) {
          throw new DatabaseError('Failed to fetch comments', error.code, error);
        }
        
        return data || [];
      })
    );
  }
}
