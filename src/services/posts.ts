
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput, Post } from "@/types/post";
import { parseCoordinatesFromDB } from "@/types/post";

/**
 * Add a new post to the database
 */
export const addPost = async (postData: CreatePostInput) => {
  const { data, error } = await supabase
    .from('items')
    .insert(postData)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

/**
 * Get all posts from the database with optimized performance
 */
export const getPosts = async (): Promise<Post[]> => {
  try {
    console.log("Fetching posts from database...");
    
    // Cache control helpers
    const cacheKey = 'posts_cache';
    const cacheExpiry = 5 * 60 * 1000; // 5 minutes in milliseconds
    
    // Check for cached data first
    if (typeof window !== 'undefined') {
      const cachedData = localStorage.getItem(cacheKey);
      if (cachedData) {
        try {
          const { data, timestamp } = JSON.parse(cachedData);
          const isExpired = Date.now() - timestamp > cacheExpiry;
          
          if (!isExpired) {
            console.log("Using cached posts data");
            return data;
          }
        } catch (e) {
          console.warn("Failed to parse cached data", e);
        }
      }
    }
    
    // First, get the base post data
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20); // Limit to 20 most recent posts for performance

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      console.log("No posts found in database");
      return [];
    }

    // Get all item IDs to fetch interaction counts
    const itemIds = data.map(item => item.id);
    
    // Use the item_interactions table to get all counts at once if available
    const { data: interactionData, error: interactionError } = await supabase
      .from('item_interactions')
      .select('*')
      .in('item_id', itemIds);
      
    // Create a map for quick lookup
    const interactionsMap = new Map();
    
    if (!interactionError && interactionData) {
      interactionData.forEach(item => {
        interactionsMap.set(item.item_id, {
          likesCount: item.likes_count || 0,
          interestsCount: item.interests_count || 0,
          commentsCount: item.comments_count || 0
        });
      });
    }
    
    // If the interactions table doesn't have all items, perform individual counts
    const likesMap = new Map();
    const interestsMap = new Map();
    const commentsMap = new Map();
    
    // For missing items, fetch counts individually and in parallel
    const missingItemIds = itemIds.filter(id => !interactionsMap.has(id));
    
    if (missingItemIds.length > 0) {
      await Promise.all([
        // Fetch likes counts for each item individually
        ...missingItemIds.map(async (itemId) => {
          const { count, error } = await supabase
            .from('likes')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', itemId);
            
          if (count !== null && !error) {
            likesMap.set(itemId, count);
          }
        }),
        
        // Fetch interests counts for each item individually
        ...missingItemIds.map(async (itemId) => {
          const { count, error } = await supabase
            .from('interests')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', itemId);
            
          if (count !== null && !error) {
            interestsMap.set(itemId, count);
          }
        }),
        
        // Fetch comments counts for each item individually
        ...missingItemIds.map(async (itemId) => {
          const { count, error } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('item_id', itemId);
            
          if (count !== null && !error) {
            commentsMap.set(itemId, count);
          }
        })
      ]);
    }

    // Transform data to match the Post type
    const transformedData = data.map(item => {
      // Parse coordinates if they exist
      let parsedCoordinates = null;
      if (item.coordinates) {
        try {
          // Convert point to string and then parse
          const coordsStr = String(item.coordinates);
          const coords = parseCoordinatesFromDB(coordsStr);
          if (coords) {
            parsedCoordinates = JSON.stringify(coords);
          }
        } catch (err) {
          console.error("Error parsing coordinates:", err, item.coordinates);
        }
      }

      // Get counts either from interactions table or individual counts
      const interactions = interactionsMap.get(item.id);
      const likesCount = interactions ? interactions.likesCount : (likesMap.get(item.id) || 0);
      const interestsCount = interactions ? interactions.interestsCount : (interestsMap.get(item.id) || 0);
      const commentsCount = interactions ? interactions.commentsCount : (commentsMap.get(item.id) || 0);

      // Create the post object
      return {
        id: item.id.toString(),
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        condition: item.condition || '',
        measurements: (typeof item.measurements === 'object' && item.measurements !== null) 
          ? item.measurements as { [key: string]: string }
          : {},
        images: item.images || [],
        location: item.location || '',
        coordinates: parsedCoordinates,
        postedBy: {
          id: item.user_id,
          name: item.profiles 
            ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User',
          avatar: item.profiles?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
        },
        createdAt: item.created_at || '',
        status: item.status || '',
        likesCount,
        interestsCount,
        commentsCount
      } as Post;
    });

    // Cache the transformed data
    if (typeof window !== 'undefined') {
      localStorage.setItem(cacheKey, JSON.stringify({
        data: transformedData,
        timestamp: Date.now()
      }));
    }

    console.log("Transformed posts:", transformedData);
    return transformedData;
  } catch (error) {
    console.error("Error in getPosts:", error);
    throw error;
  }
};

/**
 * Get posts near a specific location
 */
export const getPostsNearby = async (lat: number, lng: number, radius = 10) => {
  // In a real implementation, this would use PostGIS or similar
  // For now, we'll just return all posts as a placeholder
  return getPosts();
};
