
import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuthCheck } from "./utils/authCheck";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { DEMO_USER } from "@/data/mockUser";
import type { User } from "./utils/userUtils";
import { useTranslation } from "react-i18next";
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import { useMyLikedStore } from "@/stores/myLikedStore";
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";
import { useAuthStore } from "@/hooks/auth/authStore";

export const useLikes = (id: string, userId?: string | null) => {
  const demoStore = useDemoInteractionsStore();
  const demoIsLiked = demoStore.isLiked(id);
  const initialLikes = useInitialCountsStore((s) => s.counts[String(id)]?.likesCount);
  const myLikedRealtime = useMyLikedStore((s) => s.byItem[String(id)]);
  const setMyLiked = useMyLikedStore((s) => s.set);

  const [isLiked, setIsLiked] = useState(
    DEMO_MODE ? demoIsLiked : (typeof myLikedRealtime === "boolean" ? myLikedRealtime : false)
  );
  const [likesCount, setLikesCount] = useState(initialLikes ?? 0);
  const [likers, setLikers] = useState<User[]>([]);
  const [loading, setLoading] = useState(!DEMO_MODE);
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();
  const { t } = useTranslation();
  const authInitialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (DEMO_MODE) {
      setIsLiked(demoIsLiked);
      const count = demoIsLiked ? 1 : 0;
      setLikesCount(count);
      if (demoIsLiked) {
        setLikers([{
          id: DEMO_USER.id,
          name: DEMO_USER.user_metadata.full_name || "Demo User",
          avatar: DEMO_USER.user_metadata.avatar_url || ""
        }]);
      } else {
        setLikers([]);
      }
    }
  }, [demoIsLiked]);

  // Sync local count with the global store so realtime updates from
  // other users propagate instantly to this card's counter.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (typeof initialLikes === "number") setLikesCount(initialLikes);
  }, [initialLikes]);

  // Mirror the global "my liked" state into local state so the heart
  // colour/state hydrates correctly on mount (from the bulk pre-fetch)
  // and updates live across tabs and devices.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (typeof myLikedRealtime === "boolean") setIsLiked(myLikedRealtime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myLikedRealtime]);

  useEffect(() => {
    if (DEMO_MODE) return;
    if (!authInitialized) return;
    if (typeof myLikedRealtime === "boolean") {
      setIsLiked(myLikedRealtime);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const fetchLikes = async () => {
      if (isAuthRequestCircuitOpen()) {
        if (!cancelled) setLoading(false);
        return;
      }

      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        if (!cancelled) setLoading(false);
        return;
      }

      if (!cancelled) setLoading(true);
      try {
        if (userId) {
          const { data: likeData, error: likeError } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('item_id', numericId)
            .maybeSingle();

          if (cancelled) return;

          if (likeError) {
            maybeRecoverFromAuthError(likeError, "useLikes like status fetch");
          } else {
            setIsLiked(!!likeData);
            setMyLiked(id, !!likeData);
          }
        }

        // Do not fetch the full liker list during card mount. Feed counts are
        // seeded by the bulk counts query and kept fresh by count realtime;
        // full liker lists are loaded only on explicit counter interaction.
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching likes:", error);
        maybeRecoverFromAuthError(error, "useLikes initial fetch");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchLikes();

    return () => {
      cancelled = true;
    };
  }, [id, userId, authInitialized, myLikedRealtime, setMyLiked]);

  const fetchLikersInternal = async (numericId: number, isCancelled?: () => boolean): Promise<User[]> => {
    const cancelled = () => isCancelled?.() === true;
    if (!authInitialized) return [];
    if (isAuthRequestCircuitOpen()) return [];

    try {
      const { data: likesData, error: likesError } = await supabase
        .from('likes')
        .select('user_id')
        .eq('item_id', numericId);
        
      if (cancelled()) return [];
      if (likesError) {
        if (maybeRecoverFromAuthError(likesError, "useLikes likers fetch")) throw likesError;
        console.error('Error fetching likes data:', likesError);
        return [];
      }
      
      if (!likesData || likesData.length === 0) {
        if (!cancelled()) { setLikesCount(0); setLikers([]); }
        return [];
      }
      
      if (!cancelled()) setLikesCount(likesData.length);
      
      const userIds = [...new Set(likesData.map(like => like.user_id))];
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', userIds);
      
      if (cancelled()) return [];
      if (profilesError) {
        if (maybeRecoverFromAuthError(profilesError, "useLikes profiles fetch")) throw profilesError;
        console.error('Error fetching profiles:', profilesError);
        return [];
      }
      
      if (!profilesData || profilesData.length === 0) {
        if (!cancelled()) setLikers([]);
        return [];
      }
      
      const users = profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url || undefined,
      }));
      
      if (!cancelled()) setLikers(users);
      return users;
    } catch (error) {
      if (maybeRecoverFromAuthError(error, "useLikes fetchLikersInternal")) throw error;
      console.error('Error in fetchLikersInternal:', error);
      return [];
    }
  };

  const handleLike = async () => {
    if (DEMO_MODE) {
      demoStore.toggleLike(id);
      return;
    }
    
    if (!await checkAuth(t('interactions.like_action'))) return;
    
    const numericId = parseInt(id, 10);
    if (isNaN(numericId) || !userId) return;
    
    const wasLiked = isLiked;
    const previousCount = likesCount;
    const previousLikers = [...likers];
    
    // Optimistic flip — update UI immediately and adjust counter so the
    // user gets instant feedback. Realtime / list refetch reconciles the
    // exact list in the background.
    const newCount = Math.max(0, previousCount + (wasLiked ? -1 : 1));
    setIsLiked(!wasLiked);
    setLikesCount(newCount);
    // Mirror into the shared store so the count is consistent across
    // any other consumer of this item's counts (and survives even if the
    // realtime DELETE event is dropped by Postgres replica identity).
    useInitialCountsStore
      .getState()
      .setBulkCounts([{ itemId: id, likesCount: newCount }]);
    setMyLiked(id, !wasLiked);
    
    try {
      if (wasLiked) {
        // DELETE is naturally idempotent — "no rows affected" is fine.
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('user_id', userId)
          .eq('item_id', numericId);
          
        if (error) throw error;
      } else {
        // upsert with ignoreDuplicates absorbs the race where realtime
        // hasn't yet told us our row already exists.
        const { error } = await supabase
          .from('likes')
          .upsert([{ user_id: userId, item_id: numericId }], {
            onConflict: 'user_id,item_id',
            ignoreDuplicates: true,
          });
          
        if (error) throw error;
      }
      
      // Background reconcile — don't block the UI.
      fetchLikersInternal(numericId).catch((err) => {
        console.error('Background likers refresh failed:', err);
      });
    } catch (error) {
      console.error('Error toggling like:', error);
      if (maybeRecoverFromAuthError(error, "toggle like")) return;
      
      setIsLiked(wasLiked);
      setLikesCount(previousCount);
      setLikers(previousLikers);
      
      toast({
        title: t('post.error'),
        description: t('interactions.like_error'),
        variant: "destructive",
      });
    }
  };
  
  const fetchLikers = useCallback(async (): Promise<User[]> => {
    if (!authInitialized) return likers;
    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) return [];
    
    try {
      return await fetchLikersInternal(numericId);
    } catch (error) {
      console.error('Error in fetchLikers:', error);
      return likers;
    }
  }, [authInitialized, id, likers]);

  return {
    isLiked,
    likesCount,
    likers,
    loading,
    handleLike,
    fetchLikers
  };
};
