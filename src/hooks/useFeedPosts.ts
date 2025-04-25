
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import { useGlobalAuth } from "./useGlobalAuth";

export function useFeedPosts() {
  const [allPosts, setAllPosts] = useState<any[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();
  const { user } = useGlobalAuth();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match the expected format
      const transformedData = data?.map(item => {
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

      setAllPosts(transformedData);
      setFilteredPosts(transformedData);
    } catch (err: any) {
      console.error('Error fetching posts:', err);
      setError(err);

      toast({
        variant: "destructive",
        title: "Failed to load posts",
        description: "Please check your connection and try again",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadSavedPosts = useCallback(async () => {
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
        setAllPosts([]);
        setFilteredPosts([]);
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
      const transformedData = data?.map(item => {
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

      setAllPosts(transformedData);
      setFilteredPosts(transformedData);
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
  }, [user, toast]);

  const loadMyPosts = useCallback(async () => {
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
      const transformedData = data?.map(item => {
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

      setAllPosts(transformedData);
      setFilteredPosts(transformedData);
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
  }, [user, toast]);

  const loadInterestedPosts = useCallback(async () => {
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
        setAllPosts([]);
        setFilteredPosts([]);
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
      const transformedData = data?.map(item => {
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

      setAllPosts(transformedData);
      setFilteredPosts(transformedData);
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
  }, [user, toast]);

  // Filter posts by categories
  const filterByCategories = useCallback((categories: string[]) => {
    if (!categories.length) {
      // If no categories selected, show all posts
      setFilteredPosts(allPosts);
      return;
    }

    const filtered = allPosts.filter(post => 
      post.category && categories.includes(post.category)
    );
    
    setFilteredPosts(filtered);
  }, [allPosts]);

  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Load posts on initial mount
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts: filteredPosts,
    allPosts,
    isLoading,
    error,
    refreshPosts,
    filterByCategories,
    loadSavedPosts,
    loadMyPosts,
    loadInterestedPosts
  };
}
