
import { useItemUsers } from "./useItemUsers";

/**
 * Hook that manages user data related to item interactions
 */
export const useItemCardUsers = (
  itemId: string,
  comments: any[],
  fetchInterestedUsers: () => Promise<any>,
  interestsCount: number
) => {
  const { 
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  } = useItemUsers(
    comments,
    fetchInterestedUsers,
    interestsCount
  );

  return {
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  };
};
