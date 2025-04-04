
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
 * Get all posts from the database
 */
export const getPosts = async (): Promise<Post[]> => {
  try {
    console.log("Fetching posts from database...");
    // First, get the base post data
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
      .order('created_at', { ascending: false });

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
    
    // Fetch likes counts for these items
    const { data: likesCountData, error: likesError } = await supabase
      .from('likes')
      .select('item_id, count')
      .in('item_id', itemIds)
      .select('item_id, count(*)', { count: 'exact' })
      .group('item_id');
      
    // Fetch interests counts
    const { data: interestsCountData, error: interestsError } = await supabase
      .from('interests')
      .select('item_id, count')
      .in('item_id', itemIds)
      .select('item_id, count(*)', { count: 'exact' })
      .group('item_id');
      
    // Fetch comments counts
    const { data: commentsCountData, error: commentsError } = await supabase
      .from('comments')
      .select('item_id, count')
      .in('item_id', itemIds)
      .select('item_id, count(*)', { count: 'exact' })
      .group('item_id');
    
    // Create maps for easier lookup
    const likesMap = new Map();
    const interestsMap = new Map();
    const commentsMap = new Map();
    
    if (likesCountData) {
      likesCountData.forEach(item => {
        likesMap.set(item.item_id, parseInt(item.count));
      });
    }
    
    if (interestsCountData) {
      interestsCountData.forEach(item => {
        interestsMap.set(item.item_id, parseInt(item.count));
      });
    }
    
    if (commentsCountData) {
      commentsCountData.forEach(item => {
        commentsMap.set(item.item_id, parseInt(item.count));
      });
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
        likesCount: likesMap.get(item.id) || 0,
        interestsCount: interestsMap.get(item.id) || 0,
        commentsCount: commentsMap.get(item.id) || 0
      } as Post;
    });

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
