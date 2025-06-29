
import { supabase } from "@/integrations/supabase/client";
import type { InteractionCounts } from "./types";

// Create a Map to store pending requests to avoid duplicate calls
const pendingRequests = new Map<string, Promise<any>>();

// Request deduplication wrapper
const deduplicateRequest = <T>(key: string, requestFn: () => Promise<T>): Promise<T> => {
  if (pendingRequests.has(key)) {
    return pendingRequests.get(key) as Promise<T>;
  }
  
  const promise = requestFn().finally(() => {
    pendingRequests.delete(key);
  });
  
  pendingRequests.set(key, promise);
  return promise;
};

export const fetchAllInteractionCounts = async (itemIds: number[]): Promise<Map<number, InteractionCounts>> => {
  if (itemIds.length === 0) return new Map();
  
  const cacheKey = `interactions-${itemIds.sort().join(',')}`;
  
  return deduplicateRequest(cacheKey, async () => {
    const interactionsMap = new Map<number, InteractionCounts>();
    
    try {
      // Use RPC to call our database function with explicit typing
      const { data, error } = await supabase.rpc('get_bulk_interaction_counts' as any, {
        item_ids: itemIds
      });
      
      if (error) {
        console.warn('Bulk interaction counts failed, falling back to individual queries:', error);
        return await fetchInteractionCountsFallback(itemIds);
      }
      
      // Ensure data is an array and handle the response properly
      if (Array.isArray(data)) {
        data.forEach((item: any) => {
          if (item && typeof item === 'object' && 'item_id' in item) {
            interactionsMap.set(Number(item.item_id), {
              likesCount: Number(item.likes_count) || 0,
              interestsCount: Number(item.interests_count) || 0,
              commentsCount: Number(item.comments_count) || 0
            });
          }
        });
      }
      
      return interactionsMap;
    } catch (error) {
      console.error('Error fetching interaction counts:', error);
      return await fetchInteractionCountsFallback(itemIds);
    }
  });
};

const fetchInteractionCountsFallback = async (itemIds: number[]): Promise<Map<number, InteractionCounts>> => {
  const interactionsMap = new Map<number, InteractionCounts>();
  
  // Batch queries for better performance
  const batchSize = 10;
  const batches = [];
  
  for (let i = 0; i < itemIds.length; i += batchSize) {
    batches.push(itemIds.slice(i, i + batchSize));
  }
  
  await Promise.all(
    batches.map(async (batch) => {
      const [likes, interests, comments] = await Promise.all([
        supabase.from('likes').select('item_id').in('item_id', batch),
        supabase.from('interests').select('item_id').in('item_id', batch),
        supabase.from('comments').select('item_id').in('item_id', batch)
      ]);
      
      // Count occurrences
      batch.forEach(itemId => {
        const likesCount = likes.data?.filter(l => l.item_id === itemId).length || 0;
        const interestsCount = interests.data?.filter(i => i.item_id === itemId).length || 0;
        const commentsCount = comments.data?.filter(c => c.item_id === itemId).length || 0;
        
        interactionsMap.set(itemId, {
          likesCount,
          interestsCount,
          commentsCount
        });
      });
    })
  );
  
  return interactionsMap;
};

// Keep existing functions for backward compatibility
export const fetchInteractionCounts = fetchAllInteractionCounts;
export const fetchMissingCounts = async (itemIds: number[]): Promise<Map<number, InteractionCounts>> => {
  return fetchAllInteractionCounts(itemIds);
};
