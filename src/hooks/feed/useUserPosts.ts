
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import type { User } from "@supabase/supabase-js";

export function useUserPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const transformPostsData = useCallback((data: any[]) => {
    return data?.map(item => {
      const user = extractUserFromProfile(item.profiles, item.user_id);
      return {
        id: item.id,
        title: item.title,
        description: item.description,
        images: item.images,
        location: item.location,
        coordinates: item.coordinates,
        category: item.category,
        condition: item.condition,
        measurements: item.measurements,
        user_id: item.user_id,
        user_name: user.name,
        user_avatar: user.avatar || ''
      };
    }) || [];
  }, []);

  const loadSavedPosts = useCallback(async (user: User | null) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // First get all the bookmarked item IDs
      const { data: bookmarks, error: bookmarksError } = await supabase
        .from('bookmarks')
        .select('item_id')
        .eq('user_id', user.id);

      if (bookmarksError) throw bookmarksError;

      if (!bookmarks || bookmarks.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // Extract item IDs
      const itemIds = bookmarks.map(bookmark => bookmark.item_id);

      // Then fetch all items with those IDs
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .in('id', itemIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedData = transformPostsData(data);
      setPosts(transformedData);
    } catch (err: any) {
      console.error('Error fetching saved posts:', err);
      setError(err);

      toast({
        variant: "destructive",
        title: "Failed to load saved posts",
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, transformPostsData]);

  const loadMyPosts = useCallback(async (user: User | null) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedData = transformPostsData(data);
      setPosts(transformedData);
    } catch (err: any) {
      console.error('Error fetching my posts:', err);
      setError(err);

      toast({
        variant: "destructive",
        title: "Failed to load your posts",
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, transformPostsData]);

  const loadInterestedPosts = useCallback(async (user: User | null) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // First get all the interested item IDs
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('item_id')
        .eq('user_id', user.id);

      if (interestsError) throw interestsError;

      if (!interests || interests.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // Extract item IDs
      const itemIds = interests.map(interest => interest.item_id);

      // Then fetch all items with those IDs
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .in('id', itemIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data
      const transformedData = transformPostsData(data);
      setPosts(transformedData);
    } catch (err: any) {
      console.error('Error fetching interested posts:', err);
      setError(err);

      toast({
        variant: "destructive",
        title: "Failed to load interested posts",
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast, transformPostsData]);

  return {
    posts,
    isLoading,
    error,
    loadSavedPosts,
    loadMyPosts,
    loadInterestedPosts
  };
}
