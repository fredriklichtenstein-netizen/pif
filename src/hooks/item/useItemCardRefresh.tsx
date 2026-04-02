
import { useCallback } from "react";

/**
 * Hook that manages data refresh for item card interactions
 */
export const useItemCardRefresh = (
  fetchLikers: () => Promise<any>,
  fetchInterestedUsers: () => Promise<any>,
  shouldRefreshComments: boolean,
  fetchItemComments: () => void
) => {
  const refreshData = useCallback(() => {
    fetchLikers()
      .then(() => {})
      .catch(err => console.error('Error refreshing likes:', err));
    
    fetchInterestedUsers()
      .then(() => {})
      .catch(err => console.error('Error refreshing interests:', err));
    
    if (shouldRefreshComments) {
      fetchItemComments();
    }
  }, [fetchLikers, fetchInterestedUsers, shouldRefreshComments, fetchItemComments]);

  return { refreshData };
};
