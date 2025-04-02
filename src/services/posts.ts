
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput } from "@/types/post";

/**
 * Add a new post to the database
 */
export const addPost = async (postData: CreatePostInput) => {
  const { data, error } = await supabase
    .from('posts')
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
export const getPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(first_name, last_name, avatar_url)')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

/**
 * Get posts near a specific location
 */
export const getPostsNearby = async (lat: number, lng: number, radius = 10) => {
  // In a real implementation, this would use PostGIS or similar
  // For now, we'll just return all posts as a placeholder
  return getPosts();
};
