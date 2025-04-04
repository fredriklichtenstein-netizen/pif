
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

    console.log("Raw posts data:", data);

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
            ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() 
            : 'Unknown User',
          avatar: item.profiles?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
        },
        createdAt: item.created_at || '',
        status: item.status || '',
        likesCount: 0,
        interestsCount: 0, 
        commentsCount: 0
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
