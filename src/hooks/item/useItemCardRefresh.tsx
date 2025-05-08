
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
      .then(() => console.log('Refreshed likes data'))
      .catch(err => console.error('Error refreshing likes:', err));
    
    fetchInterestedUsers()
      .then(() => console.log('Refreshed interests data'))
      .catch(err => console.error('Error refreshing interests:', err));
    
    if (shouldRefreshComments) {
      fetchItemComments();
    }
  }, [fetchLikers, fetchInterestedUsers, shouldRefreshComments, fetchItemComments]);

  return { refreshData };
};
