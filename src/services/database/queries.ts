
import { supabase } from "@/integrations/supabase/client";
import { withRetry, DatabaseError } from "./connection";
import { batchQueries } from "./batch";
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
  }) {
    return monitorQuery('getPosts', () => 
      withRetry(async () => {
        // For now, we'll handle all queries the same way since we don't have geospatial RPC
        // In the future, we can add proper geospatial filtering with PostGIS
        let query = (supabase
          .from('items') as any)
          .select(`
            id, title, description, images, location, coordinates, 
            category, condition, measurements, user_id, pif_status, 
            item_type,
            archived_at, archived_reason, created_at,
            profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)
          `)
          .is('archived_at', null)
          .order('created_at', { ascending: false });
        if (options.categories?.length) {
          query = query.in('category', options.categories);
        }

        if (options.userId) {
          query = query.eq('user_id', options.userId);
        }

        if (options.limit) {
          query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
        }

        const { data, error } = await query;
        if (error) {
          console.error('🚨 CRITICAL: Database query failed:', error);
          throw new DatabaseError('Failed to fetch posts', error.code, error);
        }
        
        if (!data) {
          console.error('🚨 CRITICAL: Query returned null data');
          return [];
        }
        if (data?.[0]?.profiles) {
        }
        
        return data || [];
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
          // Use our optimized RPC function
          const { data, error } = await (supabase.rpc as any)('get_bulk_interaction_counts', {
            item_ids: itemIds
          });
          
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
    const batchSize = 5;
    const batches = [];
    
    for (let i = 0; i < itemIds.length; i += batchSize) {
      batches.push(itemIds.slice(i, i + batchSize));
    }
    
    const results = await Promise.all(
      batches.map(batch => this.getInteractionCountsForBatch(batch))
    );
    
    // Merge results
    const finalMap = new Map();
    results.forEach(map => {
      map.forEach((value, key) => finalMap.set(key, value));
    });
    
    return finalMap;
  }

  private static async getInteractionCountsForBatch(itemIds: number[]) {
    const [likes, interests, comments] = await Promise.all([
      supabase.from('likes').select('item_id').in('item_id', itemIds),
      supabase.from('interests').select('item_id').in('item_id', itemIds),
      supabase.from('comments').select('item_id').in('item_id', itemIds)
    ]);
    
    const countsMap = new Map();
    
    itemIds.forEach(itemId => {
      const likesCount = likes.data?.filter(l => l.item_id === itemId).length || 0;
      const interestsCount = interests.data?.filter(i => i.item_id === itemId).length || 0;
      const commentsCount = comments.data?.filter(c => c.item_id === itemId).length || 0;
      
      countsMap.set(itemId, { likesCount, interestsCount, commentsCount });
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
