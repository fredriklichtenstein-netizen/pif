
import { supabase } from "@/integrations/supabase/client";
import type { Post } from "@/types/post";
import { parseCoordinates } from "@/utils/coordinates/simpleCoordinateParser";

export const getPosts = async (): Promise<Post[]> => {
  try {
    // Simple database query without complex caching
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }
    // Transform data to Post format
    const transformedData: Post[] = data.map(item => {
      // Parse coordinates using simple parser
      const coordinates = parseCoordinates(item.coordinates);
      
      // Safely convert measurements to Record<string, string>
      let measurements: Record<string, string> = {};
      if (item.measurements && typeof item.measurements === 'object' && !Array.isArray(item.measurements)) {
        try {
          // Convert all values to strings
          Object.entries(item.measurements).forEach(([key, value]) => {
            if (typeof value === 'string') {
              measurements[key] = value;
            } else if (value !== null && value !== undefined) {
              measurements[key] = String(value);
            }
          });
        } catch (e) {
          console.warn("Failed to parse measurements:", item.measurements, e);
          measurements = {};
        }
      }
      
      return {
        id: item.id.toString(),
        title: item.title,
        description: item.description || '',
        category: item.category || '',
        condition: item.condition || '',
        measurements: measurements,
        images: item.images || [],
        location: item.location || '',
        coordinates: coordinates,
        postedBy: {
          id: item.user_id,
          name: item.profiles 
            ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() || 'Unknown User'
            : 'Unknown User',
          avatar: item.profiles?.avatar_url || 'https://api.dicebear.com/7.x/initials/svg?seed=Unknown'
        },
        createdAt: item.created_at || '',
        status: item.pif_status || '',
        likesCount: 0,
        interestsCount: 0,
        commentsCount: 0
      };
    });
    return transformedData;
  } catch (error) {
    console.error("Error in getPosts:", error);
    throw error;
  }
};
