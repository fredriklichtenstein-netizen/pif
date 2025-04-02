
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput, Post } from "@/types/post";

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
  const { data, error } = await supabase
    .from('items')
    .select('*, profiles:user_id(first_name, last_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  // Transform data to match the Post type
  return (data || []).map(item => ({
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
    coordinates: item.coordinates,
    postedBy: {
      id: item.user_id,
      name: item.profiles ? `${item.profiles.first_name || ''} ${item.profiles.last_name || ''}`.trim() : 'Unknown',
      avatar: item.profiles?.avatar_url || 'https://randomuser.me/api/portraits/lego/1.jpg'
    },
    createdAt: item.created_at || '',
    status: item.status || '',
    likesCount: 0,
    interestsCount: 0, 
    commentsCount: 0
  }));
};

/**
 * Get posts near a specific location
 */
export const getPostsNearby = async (lat: number, lng: number, radius = 10) => {
  // In a real implementation, this would use PostGIS or similar
  // For now, we'll just return all posts as a placeholder
  return getPosts();
};
