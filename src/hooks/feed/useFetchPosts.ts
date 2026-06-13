
import { useState, useCallback, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { extractUserFromProfile } from "@/hooks/item/utils/userUtils";
import { DEMO_MODE } from "@/config/demoMode";
import { MOCK_POSTS } from "@/data/mockPosts";
import { useTranslation } from "react-i18next";
import { extractCoordinates } from "@/utils/coordinates/coordinateExtractor";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import { useAuthStore } from "@/hooks/auth/authStore";
import {
  isAuthInvalidError,
  maybeRecoverFromAuthError,
} from "@/hooks/auth/sessionRecovery";
import { setCache, readCache, FEED_CACHE_KEYS } from "@/services/posts/cache";

const FULL_LIST_TTL = 60 * 1000; // 60s
const FULL_LIST_STALE_TTL = 5 * 60 * 1000; // serve stale up to 5min

// Normalize item_type to match map marker expectations
const normalizeItemType = (itemType: string): 'offer' | 'request' => {
  if (itemType === 'request' || itemType === 'wish') {
    return 'request';
  }
  return 'offer';
};

const isArchivedRow = (post: any) => post?.status === 'archived' || post?.pif_status === 'archived' || !!post?.archived_at;

const applyArchiveBoundary = (posts: any[], includeArchived: boolean) =>
  includeArchived ? posts.filter(isArchivedRow) : posts.filter((post) => !isArchivedRow(post));

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
  const cacheKey = FEED_CACHE_KEYS.fullList(options.includeArchived);
  // Seed from the persistent cache so switching feed↔map or refreshing
  // shows content immediately without waiting on the network.
  const seeded = !DEMO_MODE ? readCache<any[]>(cacheKey) : null;
  const seededPosts = seeded?.data ? applyArchiveBoundary(seeded.data, options.includeArchived) : [];
  const [posts, setPosts] = useState<any[]>(seededPosts);
  const [isLoading, setIsLoading] = useState(!seeded);
  const [error, setError] = useState<Error | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const fetchSeqRef = useRef(0);
  const countsFetchKeyRef = useRef<string | null>(null);
  const authInitialized = useAuthStore((s) => s.initialized);
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    if (DEMO_MODE) {
      const mockData = transformMockPosts();
      setPosts(mockData);
      setIsLoading(false);
    }
  }, []);

  const fetchPosts = useCallback(async () => {
    if (DEMO_MODE) {
      const mockData = transformMockPosts();
      setPosts(mockData);
      setIsLoading(false);
      return;
    }

    if (isFetching) {
      return;
    }

    // Persistent cache short-circuit. If we have a fresh cached payload,
    // just hand it back without touching the network. If it's stale we
    // serve it immediately and refresh in the background.
    const cached = readCache<any[]>(cacheKey);
    if (cached && !cached.isStale) {
      setPosts(applyArchiveBoundary(cached.data, options.includeArchived));
      setIsLoading(false);
      return;
    }

    const fetchSeq = ++fetchSeqRef.current;

    setIsFetching(true);
    // If we have stale data, keep showing it instead of flipping to a loader.
    if (cached?.data?.length) {
      setPosts(applyArchiveBoundary(cached.data, options.includeArchived));
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }
    setError(null);


    try {
      let query = supabase
        .from('items')
        .select('*, profiles!items_user_id_fkey(id, first_name, last_name, username, avatar_url)');
      
      if (options.includeArchived) {
        query = query
          .eq('pif_status', 'archived')
          .order('archived_at', { ascending: false, nullsFirst: false });
      } else {
        query = query
          .or('pif_status.is.null,pif_status.neq.archived')
          .is('archived_at', null)
          .order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (fetchSeq !== fetchSeqRef.current) {
        return;
      }

      if (error) throw error;

      const transformedData = applyArchiveBoundary(data?.map(item => {
        const user = extractUserFromProfile(item.profiles, item.user_id);
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          images: item.images,
          location: item.location,
          coordinates: extractCoordinates(item.coordinates),
          category: item.category,
          condition: item.condition,
          measurements: item.measurements,
          item_type: normalizeItemType(item.item_type),
          user_id: item.user_id,
          status: item.pif_status, 
          archived_at: item.archived_at,
          archived_reason: item.archived_reason,
          user_name: user.name,
          user_avatar: user.avatar || ''
        };
      }) || [], options.includeArchived);

      setPosts(transformedData);
      setCache(cacheKey, transformedData, FULL_LIST_TTL);
      void FULL_LIST_STALE_TTL;
    } catch (err: any) {
      if (fetchSeq === fetchSeqRef.current) {
        console.error('Error fetching posts:', err);

        // Stale JWT? Clear it silently — the auth-recovery flow will
        // either redirect (private routes) or wipe the bad token so the
        // next fetch goes through as anon. Skip the destructive toast.
        if (isAuthInvalidError(err)) {
          maybeRecoverFromAuthError(err, "useFetchPosts");
          setError(err);
          setIsLoading(false);
          setIsFetching(false);
          return;
        }

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
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [toast, t, options.includeArchived, cacheKey]);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!authInitialized) return;

    const itemIds = posts
      .map((p: any) => Number(p.id))
      .filter((n: number) => Number.isFinite(n));
    if (itemIds.length === 0) return;

    const countsFetchKey = `${cacheKey}:${itemIds.join(",")}`;
    if (countsFetchKeyRef.current === countsFetchKey) return;
    countsFetchKeyRef.current = countsFetchKey;

    let cancelled = false;

    const fetchInteractionCounts = async () => {
      try {
        const { data: countsData, error: countsError } = await (supabase.rpc as any)(
          'get_bulk_interaction_counts',
          { p_item_ids: itemIds }
        );

        if (cancelled || countsError || !Array.isArray(countsData)) return;

        useInitialCountsStore.getState().setBulkCounts(
          countsData.map((row: any) => ({
            itemId: row.item_id,
            likesCount: Number(row.likes_count) || 0,
            commentsCount: Number(row.comments_count) || 0,
            interestsCount: Number(row.interests_count) || 0,
            bookmarksCount: Number(row.bookmarks_count) || 0,
          }))
        );
      } catch (e) {
        // Silent fallback — individual hooks will still load counts lazily.
      }
    };

    const timer = window.setTimeout(fetchInteractionCounts, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [posts, authInitialized, cacheKey]);

  const cleanup = useCallback(() => {
    fetchSeqRef.current += 1;
  }, []);

  // Auto-abort any in-flight fetch on unmount so nothing lingers across
  // login/reload cycles.
  useEffect(() => {
    return () => {
      fetchSeqRef.current += 1;
      countsFetchKeyRef.current = null;
    };
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
