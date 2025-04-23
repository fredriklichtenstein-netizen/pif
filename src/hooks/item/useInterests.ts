
import { useEffect } from "react";
import { useInterestState } from "./interest/useInterestState";
import { useInterestFetch } from "./interest/useInterestFetch";
import { useInterestActions } from "./interest/useInterestActions";
import type { User } from "./utils/userUtils";

export const useInterests = (id: string, userId?: string | null) => {
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

  const { handleShowInterest } = useInterestActions(setShowInterest, fetchInterestedUsersInternal);

  // Initial fetch of interests
  useEffect(() => {
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

  return {
    showInterest,
    interestsCount,
    interestedUsers,
    loading,
    interestedUsersError,
    handleShowInterest: () => handleShowInterest(id, userId),
    fetchInterestedUsers: () => fetchInterestedUsers(id)
  };
};

// Re-export the User type for consumers of this hook
export type { User };
