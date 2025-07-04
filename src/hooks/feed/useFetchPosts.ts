
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";

export function useFetchPosts(options = { includeArchived: false }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const fetchPosts = useCallback(async () => {
    // Prevent concurrent fetches
    if (isFetching) {
      console.log("Fetch already in progress, skipping redundant call");
      return;
    }
    
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    setIsFetching(true);
    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching posts from database...");
      
      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .abortSignal(signal);
      
      // Filter out archived items unless specifically requested
      if (!options.includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data, error } = await query;

      // Don't update state if request was aborted or component unmounted
      if (signal.aborted) {
        console.log('Request aborted, skipping state update');
        return;
      }

      if (error) throw error;

      // Transform data to match the expected format
      const transformedData = data?.map(item => {
        console.log('Debug - item.profiles:', item.profiles, 'item.user_id:', item.user_id);
        const user = extractUserFromProfile(item.profiles, item.user_id);
        console.log('Debug - extracted user:', user);
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
          status: item.status, 
          archived_at: item.archived_at,
          archived_reason: item.archived_reason,
          user_name: user.name,
          user_avatar: user.avatar || ''
        };
      }) || [];

      setPosts(transformedData);
      console.log('Posts fetched successfully:', { count: transformedData.length });
    } catch (err: any) {
      // Only set error if request wasn't aborted
      if (err.name !== 'AbortError' && !signal.aborted) {
        console.error('Error fetching posts:', err);
        setError(err);

        // Only show toast for network errors, not for component unmount
        if (err.code !== 'ABORT_ERR') {
          toast({
            variant: "destructive",
            title: "Failed to load posts",
            description: "Please check your connection and try again",
          });
        }
      }
    } finally {
      // Only update state if request wasn't aborted
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [toast, options.includeArchived]);

  // Cleanup function to abort any pending requests
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    posts,
    isLoading,
    error,
    fetchPosts,
    setPosts,
    cleanup
  };
}
