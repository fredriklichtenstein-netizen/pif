
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
import { isAuthRequestCircuitOpen, maybeRecoverFromAuthError } from "@/hooks/auth/sessionRecovery";
import { useAuthStore } from "@/hooks/auth/authStore";

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

  const authInitialized = useAuthStore((s) => s.initialized);

  // Initial fetch of interests
  useEffect(() => {
    if (DEMO_MODE) return;
    if (!authInitialized) return;
    if (typeof myInterestRealtime === "boolean") {
      setShowInterest(myInterestRealtime);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const initializeInterests = async () => {
      if (isAuthRequestCircuitOpen()) return;

      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) {
        return;
      }

      try {
        if (userId) {
          const { data: userInterest, error: userInterestError } = await supabase
            .from('interests')
            .select('id')
            .eq('user_id', userId)
            .eq('item_id', numericId)
            .maybeSingle();

          if (cancelled) return;

          if (userInterestError) {
            maybeRecoverFromAuthError(userInterestError, "useInterests user interest fetch");
          } else {
            setShowInterest(!!userInterest);
            setMyInterest(id, !!userInterest);
          }
        }

        if (cancelled) return;
        setLoading(false);
      } catch (error) {
        if (cancelled) return;
        console.error("Error fetching interests:", error);
        maybeRecoverFromAuthError(error, "useInterests initial fetch");
        setLoading(false);
      }
    };

    initializeInterests();

    return () => {
      cancelled = true;
    };
  }, [id, userId, authInitialized, myInterestRealtime, setMyInterest]);

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
    handleShowInterest: DEMO_MODE
      ? (_note?: string) => handleShowInterestDemo()
      : (note?: string) => originalHandleShowInterest(id, userId, note),
    fetchInterestedUsers: () => DEMO_MODE ? Promise.resolve(interestedUsers) : fetchInterestedUsers(id)
  };
};

// Re-export the User type for consumers of this hook
export type { User };
