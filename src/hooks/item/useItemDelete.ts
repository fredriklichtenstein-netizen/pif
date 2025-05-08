
import { useState, useCallback } from "react";
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

  // Handle successful delete or archive with better error recovery
  const handleDeleteSuccess = useCallback(() => {
    console.log("Item was successfully deleted or archived");
    
    try {
      // Clean up any realtime connections or subscriptions
      cleanupRealtime();
      
      // Mark item as deleted in the UI to remove it
      setIsItemDeleted(true);
      
      // Call the parent's success callback after a short delay to allow state updates
      if (onOperationSuccess) {
        // Use setTimeout to ensure UI updates first
        setTimeout(() => {
          try {
            onOperationSuccess();
          } catch (error) {
            console.error("Error in onOperationSuccess callback:", error);
            toast({
              title: "Update Error",
              description: "Something went wrong while refreshing the page. Please refresh manually.",
              variant: "destructive",
            });
            // Force a navigation refresh if callback fails
            setTimeout(() => {
              navigate(`/feed?t=${Date.now()}`, { replace: true });
            }, 300);
          }
        }, 300);
      } else {
        // If no success callback, force a navigation refresh
        setTimeout(() => {
          navigate(`/feed?t=${Date.now()}`, { replace: true });
        }, 300);
      }
    } catch (error) {
      console.error("Error handling delete success:", error);
      // Even if there's an error, try to navigate
      setTimeout(() => {
        navigate(`/feed?t=${Date.now()}`, { replace: true });
      }, 500);
    }
  }, [onOperationSuccess, navigate, toast, cleanupRealtime]);

  return {
    isItemDeleted,
    setIsItemDeleted,
    handleDeleteSuccess
  };
};
