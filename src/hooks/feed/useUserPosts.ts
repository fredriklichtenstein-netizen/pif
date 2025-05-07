
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UseUserPostsOptions {
  includeArchived?: boolean;
  onlyArchived?: boolean;
}

export function useUserPosts(options: UseUserPostsOptions = {}) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  // Load only posts saved by the user
  const loadSavedPosts = async (user: any) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: bookmarks, error: bookmarkError } = await supabase
        .from('bookmarks')
        .select('item_id')
        .eq('user_id', user.id);
      
      if (bookmarkError) throw bookmarkError;
      
      if (!bookmarks || bookmarks.length === 0) {
        setPosts([]);
        return;
      }
      
      const itemIds = bookmarks.map(b => b.item_id);
      
      const query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(*)')
        .in('id', itemIds)
        .order('created_at', { ascending: false });
      
      // Handle archived items
      if (!options.includeArchived && !options.onlyArchived) {
        query.is('archived_at', null);
      } else if (options.onlyArchived) {
        query.not('archived_at', 'is', null);
      }
      
      const { data, error: itemsError } = await query;
      
      if (itemsError) throw itemsError;
      
      setPosts(formatPosts(data || []));
    } catch (err) {
      console.error('Error loading saved posts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading saved posts'));
      toast({
        title: "Error",
        description: "Failed to load your saved posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load posts the user has shown interest in
  const loadInterestedPosts = async (user: any) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data: interests, error: interestsError } = await supabase
        .from('interests')
        .select('item_id')
        .eq('user_id', user.id);
      
      if (interestsError) throw interestsError;
      
      if (!interests || interests.length === 0) {
        setPosts([]);
        return;
      }
      
      const itemIds = interests.map(i => i.item_id);
      
      const query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(*)')
        .in('id', itemIds)
        .order('created_at', { ascending: false });
      
      // Handle archived items
      if (!options.includeArchived && !options.onlyArchived) {
        query.is('archived_at', null);
      } else if (options.onlyArchived) {
        query.not('archived_at', 'is', null);
      }
      
      const { data, error: itemsError } = await query;
      
      if (itemsError) throw itemsError;
      
      setPosts(formatPosts(data || []));
    } catch (err) {
      console.error('Error loading interested posts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading interested posts'));
      toast({
        title: "Error",
        description: "Failed to load posts you're interested in",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load user's own posts
  const loadMyPosts = async (user: any) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(*)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Handle archived items
      if (!options.includeArchived && !options.onlyArchived) {
        query.is('archived_at', null);
      } else if (options.onlyArchived) {
        query.not('archived_at', 'is', null);
      }
      
      const { data, error: itemsError } = await query;
      
      if (itemsError) throw itemsError;
      
      setPosts(formatPosts(data || []));
    } catch (err) {
      console.error('Error loading user posts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading your posts'));
      toast({
        title: "Error",
        description: "Failed to load your posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // New method: Load only archived posts by the user
  const loadArchivedPosts = async (user: any) => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error: itemsError } = await supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(*)')
        .eq('user_id', user.id)
        .not('archived_at', 'is', null)
        .order('archived_at', { ascending: false });
      
      if (itemsError) throw itemsError;
      
      setPosts(formatPosts(data || []));
    } catch (err) {
      console.error('Error loading archived posts:', err);
      setError(err instanceof Error ? err : new Error('Unknown error loading archived posts'));
      toast({
        title: "Error",
        description: "Failed to load your archived posts",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to format posts
  const formatPosts = (posts: any[]) => {
    return posts.map(post => ({
      ...post,
      postedBy: {
        id: post.user_id,
        name: post.profiles?.first_name 
          ? `${post.profiles.first_name} ${post.profiles.last_name?.[0] || ""}.` 
          : "Unknown User",
        avatar: post.profiles?.avatar_url || "",
      },
      image: post.images?.[0] || "",
      isArchived: post.archived_at !== null
    }));
  };

  return {
    posts,
    isLoading,
    error,
    loadSavedPosts,
    loadMyPosts,
    loadInterestedPosts,
    loadArchivedPosts
  };
}
