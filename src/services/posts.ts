
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput, Post } from "@/types/post";
import { parseCoordinatesFromDB } from "@/types/post";

/**
 * Add a new post to the database
 */
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

/**
 * Get all posts from the database with optimized performance
 */
export const getPosts = async (): Promise<Post[]> => {
  try {
    // Legacy localStorage cache removed — it could hold malformed JSON
    // (e.g. PostGIS "(lng,lat)" strings written by earlier builds) which
    // caused "Unexpected token '('" parse errors on every page load.
    if (typeof window !== 'undefined') {
      try { localStorage.removeItem('posts_cache'); } catch { /* ignore */ }
    }

    
    // First, get the base post data
    const { data, error } = await supabase
      .from('items')
      .select('*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)')
      .or('pif_status.is.null,pif_status.neq.archived')
      .is('archived_at', null)
      .order('created_at', { ascending: false })
      .limit(20) as any;

    if (error) {
      console.error("Supabase error:", error);
      throw error;
    }

    if (!data || data.length === 0) {
      return [];
    }

    // Get all item IDs to fetch interaction counts
    const itemIds = data.map(item => item.id);
    
    // Use the item_interactions table to get all counts at once if available
    const { data: interactionData, error: interactionError } = await (supabase
      .from as any)('item_interactions')
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
    
    // If the interactions table doesn't have all items, fetch missing counts in
    // three batched queries. Never loop per item for feed counters.
    const likesMap = new Map();
    const interestsMap = new Map();
    const commentsMap = new Map();
    
    // For missing items, fetch counts individually and in parallel
    const missingItemIds = itemIds.filter(id => !interactionsMap.has(id));
    
    if (missingItemIds.length > 0) {
      const [likes, interests, comments] = await Promise.all([
        supabase.from('likes').select('item_id').in('item_id', missingItemIds),
        supabase.from('interests').select('item_id').in('item_id', missingItemIds),
        supabase.from('comments').select('item_id').in('item_id', missingItemIds),
      ]);

      likes.data?.forEach((row) => likesMap.set(row.item_id, (likesMap.get(row.item_id) || 0) + 1));
      interests.data?.forEach((row) => interestsMap.set(row.item_id, (interestsMap.get(row.item_id) || 0) + 1));
      comments.data?.forEach((row) => commentsMap.set(row.item_id, (commentsMap.get(row.item_id) || 0) + 1));
    }

    // Transform data to match the Post type
    const transformedData = data.map(item => {
      // Parse PostGIS "(lng,lat)" text into the app's coordinate object shape.
      let parsedCoordinates = null;
      if (item.coordinates) {
        try {
          const coordsStr = String(item.coordinates);
          parsedCoordinates = parseCoordinatesFromDB(coordsStr);
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
        status: item.pif_status || '',
        likesCount,
        interestsCount,
        commentsCount
      } as Post;
    });

    // Legacy write removed alongside the legacy read — the optimized
    // feed path owns caching now (see src/services/posts/cache.ts).

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
