
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export function useFeedPosts() {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

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
        const firstName = item.profiles?.first_name || '';
        const lastName = item.profiles?.last_name || '';
        // Only include the first letter of the last name, if present
        let displayName = '';
        if (firstName && lastName) {
          displayName = `${firstName} ${lastName.charAt(0)}`;
        } else if (firstName) {
          displayName = firstName;
        } else {
          displayName = 'Anonymous';
        }

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
          user_name: displayName,
          user_avatar: item.profiles?.avatar_url || ''
        };
      }) || [];
      
      setPosts(transformedData);
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

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const refreshPosts = useCallback(() => {
    fetchPosts();
  }, [fetchPosts]);

  return {
    posts,
    isLoading,
    error,
    refreshPosts
  };
}
