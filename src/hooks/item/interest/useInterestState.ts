
import { useState } from "react";
import type { User } from "../utils/userUtils";

export const useInterestState = () => {
  const [showInterest, setShowInterest] = useState(false);
  const [interestsCount, setInterestsCount] = useState(0);
  const [interestedUsers, setInterestedUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [interestedUsersError, setInterestedUsersError] = useState<Error | null>(null);
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
    setFetchAttemptCount
  };
};
