
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

/**
 * Hook to handle refreshing item data with error handling
 */
export const useRealtimeRefresh = (
  itemId: string,
  refreshData: () => void,
  retry: () => void,
  handleReconnect: () => void
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  // Enhanced refresh with proper error handling
  const refreshItemData = useCallback(() => {
    try {
      console.log(`Manual refresh requested for item ${itemId}`);
      handleReconnect();
      retry();
      refreshData();
      return true;
    } catch (error) {
      console.error("Error refreshing item data:", error);
      toast({
        title: t('interactions.error_refreshing'),
        description: t('interactions.error_refreshing_description'),
        variant: "destructive"
      });
      return false;
    }
  }, [refreshData, itemId, retry, handleReconnect, toast]);
  
  return {
    refreshItemData
  };
};
