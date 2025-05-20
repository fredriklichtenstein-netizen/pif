
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useFeedContext } from "@/context/feed";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

interface UseFeedItemOperationsProps {
  onItemOperationSuccess?: (itemId?: string | number, operationType?: OperationType) => void;
}

export function useFeedItemOperations({ onItemOperationSuccess }: UseFeedItemOperationsProps) {
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [errorState, setErrorState] = useState<{ hasError: boolean, errorMessage: string }>({ 
    hasError: false, 
    errorMessage: '' 
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { toast } = useToast();
  const { deleteItem, archiveItem, restoreItem } = useFeedContext();

  // Enhanced recovery function with debouncing and complete refresh
  const handleRecoveryAction = useCallback(() => {
    try {
      setIsRefreshing(true);
      
      // Force component re-render with a new key
      setRefreshKey(Date.now());
      setErrorState({ hasError: false, errorMessage: '' });
      
      toast({
        title: "Refreshing",
        description: "Attempting to recover and refresh the feed",
      });
      
      // Clean up any potential timers
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
      
      // Wait a bit then call onItemOperationSuccess to refresh data
      refreshTimerRef.current = setTimeout(() => {
        if (onItemOperationSuccess) {
          try {
            onItemOperationSuccess();
            console.log("Feed data refresh completed");
          } catch (err) {
            console.error("Error during recovery refresh:", err);
            // If the callback fails, we'll still try to recover UI
            setRefreshKey(Date.now() + 1);
          } finally {
            setIsRefreshing(false);
            refreshTimerRef.current = null;
          }
        } else {
          setIsRefreshing(false);
        }
      }, 800); // Longer delay for more complete refresh
    } catch (err) {
      console.error("Error during recovery action:", err);
      toast({
        title: "Recovery failed",
        description: "Please try refreshing the page manually",
        variant: "destructive",
      });
      setIsRefreshing(false);
    }
  }, [onItemOperationSuccess, toast]);

  // Enhanced handler for item operations
  const handleItemSuccess = useCallback((itemId: string | number, operationType?: OperationType) => {
    try {
      console.log(`Item ${operationType || 'operation'} success callback triggered for item ${itemId}`);
      
      // Reset any error state
      if (errorState.hasError) {
        setErrorState({ hasError: false, errorMessage: '' });
      }
      
      // Use feed context directly for immediate UI update
      if (operationType === 'delete') {
        deleteItem(itemId);
      } else if (operationType === 'archive') {
        archiveItem(itemId);
      } else if (operationType === 'restore') {
        restoreItem(itemId);
      }
      
      // Still pass to parent component for backend updates
      if (onItemOperationSuccess) {
        try {
          onItemOperationSuccess(itemId, operationType);
        } catch (err) {
          console.error("Error in operation success handler:", err);
          setErrorState({
            hasError: true,
            errorMessage: "Error updating feed. Please try refreshing."
          });
        }
      }
    } catch (err) {
      console.error("Error in handleItemSuccess:", err);
      setErrorState({
        hasError: true,
        errorMessage: "Error updating feed. Please try refreshing."
      });
    }
  }, [onItemOperationSuccess, errorState, deleteItem, archiveItem, restoreItem]);

  // Cleanup function
  const cleanupTimers = useCallback(() => {
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
    }
  }, []);

  return {
    refreshKey,
    errorState,
    isRefreshing,
    handleRecoveryAction,
    handleItemSuccess,
    cleanupTimers
  };
}
