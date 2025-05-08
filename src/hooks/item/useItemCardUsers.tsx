
import { useItemUsers } from "./useItemUsers";

/**
 * Hook that manages user data related to item interactions
 */
export const useItemCardUsers = (
  itemId: string,
  comments: any[],
  fetchLikers: () => Promise<any>,
  likesCount: number,
  fetchInterestedUsers: () => Promise<any>,
  interestsCount: number
) => {
  const { 
    likers, 
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  } = useItemUsers(
    comments,
    fetchLikers,
    likesCount,
    fetchInterestedUsers,
    interestsCount
  );

  return {
    likers, 
    commenters, 
    interestedUsers, 
    getInterestedUsers,
    isLoadingInterested,
    interestedError
  };
};
