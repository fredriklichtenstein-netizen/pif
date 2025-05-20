
import { supabase } from "@/integrations/supabase/client";
import type { InteractionCounts } from "./types";

/**
 * Fetch interaction counts for multiple items from the item_interactions table
 */
export const fetchInteractionCounts = async (itemIds: number[]): Promise<Map<number, InteractionCounts>> => {
  const interactionsMap = new Map<number, InteractionCounts>();
  
  // Try to get counts from item_interactions table first
  const { data: interactionData, error: interactionError } = await supabase
    .from('item_interactions')
    .select('*')
    .in('item_id', itemIds);
    
  if (!interactionError && interactionData) {
    interactionData.forEach(item => {
      interactionsMap.set(item.item_id, {
        likesCount: item.likes_count || 0,
        interestsCount: item.interests_count || 0,
        commentsCount: item.comments_count || 0
      });
    });
  }
  
  return interactionsMap;
};

/**
 * Fetch missing interaction counts for items not found in the item_interactions table
 */
export const fetchMissingCounts = async (itemIds: number[]): Promise<Map<number, InteractionCounts>> => {
  const countsMap = new Map<number, InteractionCounts>();
  
  await Promise.all(
    itemIds.map(async (itemId) => {
      const [likesCount, interestsCount, commentsCount] = await Promise.all([
        fetchLikesCount(itemId),
        fetchInterestsCount(itemId),
        fetchCommentsCount(itemId)
      ]);
      
      countsMap.set(itemId, {
        likesCount: likesCount || 0,
        interestsCount: interestsCount || 0,
        commentsCount: commentsCount || 0
      });
    })
  );
  
  return countsMap;
};

/**
 * Fetch likes count for a specific item
 */
const fetchLikesCount = async (itemId: number): Promise<number> => {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', itemId);
    
  return error ? 0 : (count || 0);
};

/**
 * Fetch interests count for a specific item
 */
const fetchInterestsCount = async (itemId: number): Promise<number> => {
  const { count, error } = await supabase
    .from('interests')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', itemId);
    
  return error ? 0 : (count || 0);
};

/**
 * Fetch comments count for a specific item
 */
const fetchCommentsCount = async (itemId: number): Promise<number> => {
  const { count, error } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('item_id', itemId);
    
  return error ? 0 : (count || 0);
};
