
import { useEffect } from "react";
import { useInterestState } from "./interest/useInterestState";
import { useInterestFetch } from "./interest/useInterestFetch";
import { useInterestActions } from "./interest/useInterestActions";
import { supabase } from "@/integrations/supabase/client";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { DEMO_USER } from "@/data/mockUser";
import { useToast } from "@/hooks/use-toast";
import type { User } from "./utils/userUtils";

export const useInterests = (id: string, userId?: string | null) => {
  const demoStore = useDemoInteractionsStore();
  const demoIsInterested = demoStore.isInterested(id);
  const { toast } = useToast();
  
  const {
    showInterest,
    setShowInterest,
    interestsCount,
    setInterestsCount,
    interestedUsers,
    setInterestedUsers,
    loading,
    setLoading,
    interestedUsersError,
    setInterestedUsersError,
    fetchAttemptCount,
    setFetchAttemptCount
  } = useInterestState();

  const { fetchInterestedUsers, fetchInterestedUsersInternal } = useInterestFetch(
    setInterestedUsers,
    setInterestsCount,
    setLoading,
    setInterestedUsersError,
    setFetchAttemptCount,
    fetchAttemptCount,
    interestedUsers
  );

  const { handleShowInterest: originalHandleShowInterest } = useInterestActions(setShowInterest, fetchInterestedUsersInternal);

  // Sync demo state
  useEffect(() => {
    if (DEMO_MODE) {
      setShowInterest(demoIsInterested);
      const count = demoIsInterested ? 1 : 0;
      setInterestsCount(count);
      if (demoIsInterested) {
        setInterestedUsers([{
          id: DEMO_USER.id,
          name: DEMO_USER.user_metadata.full_name || "Demo User",
          avatar: DEMO_USER.user_metadata.avatar_url || ""
        }]);
      } else {
        setInterestedUsers([]);
      }
      setLoading(false);
    }
  }, [demoIsInterested]);

  // Initial fetch of interests
  useEffect(() => {
    if (DEMO_MODE) return;
    
    const initializeInterests = async () => {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        if (userId) {
          const { data: userInterest, error: userInterestError } = await supabase
            .from('interests')
            .select('id')
            .eq('user_id', userId)
            .eq('item_id', numericId)
            .maybeSingle();
            
          if (!userInterestError) {
            setShowInterest(!!userInterest);
          }
        }
        
        await fetchInterestedUsersInternal(numericId);
      } catch (error) {
        console.error("Error fetching interests:", error);
      } finally {
        setLoading(false);
      }
    };
    
    initializeInterests();
  }, [id, userId]);

  // Demo mode handler
  const handleShowInterestDemo = () => {
    const newState = demoStore.toggleInterest(id);
    toast({
      title: newState ? "Interest shown" : "Interest removed",
      description: newState 
        ? "You've shown interest in this item" 
        : "You are no longer interested in this item",
    });
  };

  return {
    showInterest,
    interestsCount,
    interestedUsers,
    loading: DEMO_MODE ? false : loading,
    interestedUsersError,
    handleShowInterest: DEMO_MODE ? handleShowInterestDemo : () => originalHandleShowInterest(id, userId),
    fetchInterestedUsers: () => DEMO_MODE ? Promise.resolve(interestedUsers) : fetchInterestedUsers(id)
  };
};

// Re-export the User type for consumers of this hook
export type { User };
