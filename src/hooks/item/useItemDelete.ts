
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const useItemDelete = (
  id: string | number,
  cleanupRealtime: () => void,
  onOperationSuccess?: () => void
) => {
  const [isItemDeleted, setIsItemDeleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isProcessingRef = useRef(false);

  // Handle successful delete or archive
  const handleDeleteSuccess = useCallback(() => {
    // Prevent duplicate calls during the same operation
    if (isProcessingRef.current) {
      console.log("Operation already in progress, skipping duplicate call");
      return;
    }
    
    isProcessingRef.current = true;
    console.log("Item was successfully deleted or archived");
    
    try {
      // Clean up any realtime connections or subscriptions
      cleanupRealtime();
      
      // Mark item as deleted in the UI to remove it
      setIsItemDeleted(true);
      
      // Call the parent's success callback
      if (onOperationSuccess) {
        try {
          onOperationSuccess();
        } catch (error) {
          console.error("Error in onOperationSuccess callback:", error);
          toast({
            title: "Update Error",
            description: "Something went wrong while refreshing. Please refresh manually if needed.",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error handling delete success:", error);
      
      // Even if there's an error, try to reset the UI state
      toast({
        title: "Warning",
        description: "Operation completed but there was an issue refreshing the view",
        variant: "destructive",
      });
    } finally {
      // Reset the processing flag after a delay to prevent any race conditions
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  }, [onOperationSuccess, toast, cleanupRealtime]);

  return {
    isItemDeleted,
    setIsItemDeleted,
    handleDeleteSuccess,
    isProcessing: isProcessingRef.current
  };
};
