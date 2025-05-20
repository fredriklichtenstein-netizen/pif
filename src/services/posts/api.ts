
import { supabase } from "@/integrations/supabase/client";
import type { CreatePostInput } from "@/types/post";
import { PostServiceOptions } from "./types";

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
 * Fetch base posts data from the database
 */
export const fetchBasePostsData = async (options: PostServiceOptions = {}) => {
  console.log("Fetching posts data from database...");

  let query = supabase
    .from('items')
    .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
    .order('created_at', { ascending: false })
    .limit(20);

  // Apply archive filter if specified
  if (options.includeArchived === false) {
    query = query.is('archived_at', null);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase error:", error);
    throw error;
  }

  return data || [];
};

/**
 * Fetch posts data near a specific location
 */
export const fetchPostsNearLocation = async (lat: number, lng: number, radius = 10) => {
  // In a real implementation, this would use PostGIS or similar to filter by location
  // For now, we'll just return all posts as a placeholder and filter on client
  return fetchBasePostsData();
};
