
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
import { useInitialCountsStore } from "@/stores/initialCountsStore";
import { useMyInterestStore } from "@/stores/myInterestStore";
import { useItemInterestRealtime } from "./realtime/useItemInterestRealtime";
import { maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";

export const useInterests = (id: string, userId?: string | null) => {
  const demoStore = useDemoInteractionsStore();
  const demoIsInterested = demoStore.isInterested(id);
  const { toast } = useToast();
  const initialInterests = useInitialCountsStore((s) => s.counts[String(id)]?.interestsCount);
  const myInterestRealtime = useMyInterestStore((s) => s.byItem[String(id)]);
  const setMyInterest = useMyInterestStore((s) => s.set);

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
  } = useInterestState(id);

  // Keep the local interests count in sync with the global store so
  // realtime updates (from other users) immediately reflect in the
  // counter, not only on first mount.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (typeof initialInterests === "number") {
      setInterestsCount(initialInterests);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInterests]);

  const { fetchInterestedUsers, fetchInterestedUsersInternal } = useInterestFetch(
    setInterestedUsers,
    setInterestsCount,
    setLoading,
    setInterestedUsersError,
    setFetchAttemptCount,
    fetchAttemptCount,
    interestedUsers
  );

  const { handleShowInterest: originalHandleShowInterest } = useInterestActions(
    setShowInterest,
    fetchInterestedUsersInternal,
    () => showInterest
  );

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
        return;
      }

      // Silent background fetch — no `setLoading(true)` so the
      // ActionButtons never flicker into a skeleton on mount. The card
      // already shows the correct state seeded from the global stores;
      // we just reconcile here in case the seed was stale.
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
            setMyInterest(id, !!userInterest);
          }
        }

        await fetchInterestedUsersInternal(numericId);
      } catch (error) {
        console.error("Error fetching interests:", error);
        maybeRecoverFromAuthError(error, "useInterests initial fetch");
      }
    };

    initializeInterests();
  }, [id, userId]);

  // Realtime: any change to interests for this item updates "my" interest
  // state in the global store and refetches the interested users list.
  useItemInterestRealtime(id, () => {
    if (DEMO_MODE) return;
    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) fetchInterestedUsersInternal(numericId);
  });

  // Mirror the global "my interest" state into local state so the button
  // colour/state updates live across tabs and devices.
  useEffect(() => {
    if (DEMO_MODE) return;
    if (typeof myInterestRealtime === "boolean") setShowInterest(myInterestRealtime);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myInterestRealtime]);

  // Demo mode handler
  const handleShowInterestDemo = () => {
    demoStore.toggleInterest(id);
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
