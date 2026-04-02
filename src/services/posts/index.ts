
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput, Post } from "@/types/post";
import { getPostsFromCache, cachePostsData } from "./cache";
import { fetchInteractionCounts, fetchMissingCounts } from "./interactions";
import { transformPostData } from "./transform";

export const addPost = async (postData: CreatePostInput) => {
  const { data, error } = await (supabase
    .from('items') as any)
    .insert(postData as any)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const getPosts = async (): Promise<Post[]> => {
  try {
    // Try cache first
    const cachedPosts = getPostsFromCache();
    if (cachedPosts) {
      return cachedPosts;
    }
    
    // Fetch base post data
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get all item IDs
    const itemIds = data.map(item => item.id);
    
    // Fetch interaction counts
    const interactionsMap = await fetchInteractionCounts(itemIds);
    
    // For items missing from interactions table, fetch counts individually
    const missingItemIds = itemIds.filter(id => !interactionsMap.has(id));
    if (missingItemIds.length > 0) {
      const missingCounts = await fetchMissingCounts(missingItemIds);
      missingCounts.forEach((counts, id) => interactionsMap.set(id, counts));
    }

    // Transform data
    const transformedData = data.map(item => 
      transformPostData(item, interactionsMap.get(item.id) || {
        likesCount: 0,
        interestsCount: 0,
        commentsCount: 0
      })
    );

    // Cache the transformed data
    cachePostsData(transformedData);

    return transformedData;
  } catch (error) {
    console.error("Error in getPosts:", error);
    throw error;
  }
};

export const getPostsNearby = async (lat: number, lng: number, radius = 10) => {
  // In a real implementation, this would use PostGIS or similar
  // For now, we'll just return all posts as a placeholder
  return getPosts();
};
