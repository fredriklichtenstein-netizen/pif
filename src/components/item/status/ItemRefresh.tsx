
import { useState, useCallback } from "react";

interface ItemRefreshProps {
  refreshItemData: () => void;
}

export function useItemRefresh({ refreshItemData }: ItemRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fully refresh the component if needed
  const forceRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      refreshItemData();
      setIsRefreshing(false);
    }, 100);
  }, [refreshItemData]);

  const handleRefresh = useCallback(() => {
    try {
      refreshItemData();
    } catch (error) {
      console.error("Error refreshing item data:", error);
      forceRefresh();
    }
  }, [refreshItemData, forceRefresh]);

  return {
    isRefreshing,
    forceRefresh,
    handleRefresh
  };
}
