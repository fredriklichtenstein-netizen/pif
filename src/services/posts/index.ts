
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput, Post } from "@/types/post";
import { getPostsFromCache, cachePostsData } from "./cache";
import { fetchInteractionCounts, fetchMissingCounts } from "./interactions";
import { transformPostData } from "./transform";
import { fetchBasePostsData, addPost as addPostApi, fetchPostsNearLocation } from "./api";
import type { PostServiceOptions } from "./types";

/**
 * Add a new post to the database
 */
export const addPost = async (postData: CreatePostInput) => {
  return addPostApi(postData);
};

/**
 * Get all posts with interaction counts
 */
export const getPosts = async (options: PostServiceOptions = {}): Promise<Post[]> => {
  try {
    console.log("Fetching posts from database...");
    
    // Try cache first if no specific options are provided
    if (!options.includeArchived && !options.nearbyLocation) {
      const cachedPosts = getPostsFromCache();
      if (cachedPosts) {
        console.log("Using cached posts data");
        return cachedPosts;
      }
    }
    
    // Fetch base post data
    const data = await fetchBasePostsData(options);

    if (data.length === 0) {
      console.log("No posts found in database");
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

    // Cache the transformed data if using default options
    if (!options.includeArchived && !options.nearbyLocation) {
      cachePostsData(transformedData);
    }

    return transformedData;
  } catch (error) {
    console.error("Error in getPosts:", error);
    throw error;
  }
};

/**
 * Get posts near a specific location
 */
export const getPostsNearby = async (lat: number, lng: number, radius = 10): Promise<Post[]> => {
  return getPosts({
    nearbyLocation: { lat, lng, radius }
  });
};

// Re-export everything from the submodules
export * from "./types";
