
import { useCallback } from "react";

/**
 * Hook that manages data refresh for item card interactions
 */
export const useItemCardRefresh = (
  fetchInterestedUsers: () => Promise<any>,
  shouldRefreshComments: boolean,
  fetchItemComments: () => void
) => {
  const refreshData = useCallback(() => {
    fetchInterestedUsers()
      .then(() => {})
      .catch(err => console.error('Error refreshing interests:', err));
    
    if (shouldRefreshComments) {
      fetchItemComments();
    }
  }, [fetchInterestedUsers, shouldRefreshComments, fetchItemComments]);

  return { refreshData };
};
