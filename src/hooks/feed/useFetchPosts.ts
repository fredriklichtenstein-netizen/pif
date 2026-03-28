
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_POSTS } from "@/data/mockPosts";
import { useTranslation } from "react-i18next";

// Normalize item_type to match map marker expectations
const normalizeItemType = (itemType: string): 'offer' | 'request' => {
  if (itemType === 'request' || itemType === 'wish') {
    return 'request';
  }
  return 'offer';
};

// Transform mock posts to the expected format
const transformMockPosts = () => {
  return MOCK_POSTS.map(post => ({
    id: post.id,
    title: post.title,
    description: post.description,
    images: post.images,
    location: post.location,
    coordinates: post.coordinates,
    category: post.category,
    condition: post.condition,
    item_type: normalizeItemType(post.item_type),
    user_id: post.postedBy.id,
    user_name: post.postedBy.name,
    user_avatar: post.postedBy.avatar,
    created_at: post.created_at,
    __isMock: true
  }));
};

export function useFetchPosts(options = { includeArchived: false }) {
  const [posts, setPosts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (DEMO_MODE) {
      console.log("📦 [FetchPosts] Demo mode - loading mock posts");
      const mockData = transformMockPosts();
      setPosts(mockData);
      setIsLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (DEMO_MODE) {
      console.log("📦 [FetchPosts] Demo mode - refreshing mock posts");
      const mockData = transformMockPosts();
      setPosts(mockData);
      setIsLoading(false);
      return;
    }

    if (isFetching) {
      console.log("Fetch already in progress, skipping redundant call");
      return;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
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
      
      if (!options.includeArchived) {
        query = query.is('archived_at', null);
      }

      const { data, error } = await query;

      if (signal.aborted) {
        console.log('Request aborted, skipping state update');
        return;
      }

      if (error) throw error;

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
          status: item.pif_status, 
          archived_at: item.archived_at,
          archived_reason: item.archived_reason,
          user_name: user.name,
          user_avatar: user.avatar || ''
        };
      }) || [];

      setPosts(transformedData);
      console.log('Posts fetched successfully:', { count: transformedData.length });
    } catch (err: any) {
      if (err.name !== 'AbortError' && !signal.aborted) {
        console.error('Error fetching posts:', err);
        setError(err);
        setIsLoading(false);
        setIsFetching(false);

        if (err.code !== 'ABORT_ERR') {
          toast({
            variant: "destructive",
            title: t('interactions.failed_load_posts'),
            description: t('interactions.failed_load_posts_description'),
          });
        }
      }
    } finally {
      if (abortControllerRef.current && !abortControllerRef.current.signal.aborted) {
        setIsLoading(false);
        setIsFetching(false);
      }
    }
  }, [toast, t, options.includeArchived, isFetching]);

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
