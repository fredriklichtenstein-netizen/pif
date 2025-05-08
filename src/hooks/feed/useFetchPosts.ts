
import { useState, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";

export function useFetchPosts(options = { includeArchived: false }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, avatar_url)')
        .order('created_at', { ascending: false });
      
      // Filter out archived items unless specifically requested
      if (!options.includeArchived) {
        query = query.not('status', 'eq', 'archived');
      }

      const { data, error } = await query;

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
          status: item.status, // Add status to the transformed data
          archived_at: item.archived_at, // Add archived date
          archived_reason: item.archived_reason, // Add reason
          user_name: user.name,
          user_avatar: user.avatar || ''
        };
      }) || [];

      setPosts(transformedData);
      console.log('useFetchPosts: Posts fetched successfully', { count: transformedData.length });
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
  }, [toast, options.includeArchived]);

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    setPosts
  };
}
