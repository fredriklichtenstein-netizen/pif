
import { useState } from "react";
import type { User } from "../utils/userUtils";
import { useMyInterestStore } from "@/stores/myInterestStore";
import { useInitialCountsStore } from "@/stores/initialCountsStore";

/**
 * Local state for the interest UI on a single item card.
 *
 * `showInterest` and `interestsCount` are seeded from the global stores
 * so when a card mounts (or remounts inside a list) we render the
 * correct on/off state and counter immediately — no flicker between an
 * initial "off + 0" frame and the resolved state from Supabase.
 *
 * `loading` defaults to `false` — the buttons must always render so the
 * card UI is stable. The fetch in `useInterests` runs in the background
 * and reconciles state silently when it resolves.
 */
export const useInterestState = (id?: string) => {
  const seededInterest = useMyInterestStore.getState().byItem[String(id ?? "")];
  const seededCount =
    useInitialCountsStore.getState().counts[String(id ?? "")]?.interestsCount;

  const [showInterest, setShowInterest] = useState<boolean>(!!seededInterest);
  const [interestsCount, setInterestsCount] = useState<number>(
    typeof seededCount === "number" ? seededCount : 0
  );
  const [interestedUsers, setInterestedUsers] = useState<User[]>([]);
  // No skeleton on first mount — buttons render with seeded state.
  const [loading, setLoading] = useState(false);
  const [interestedUsersError, setInterestedUsersError] =
    useState<Error | null>(null);
  const [fetchAttemptCount, setFetchAttemptCount] = useState(0);

  return {
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
    setFetchAttemptCount,
  };
};
