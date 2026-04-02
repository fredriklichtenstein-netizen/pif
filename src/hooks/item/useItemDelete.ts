
import { useState, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

export const useItemDelete = (
  id: string | number,
  cleanupRealtime: () => void,
  onOperationSuccess?: () => void
) => {
  const [isItemDeleted, setIsItemDeleted] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const isProcessingRef = useRef(false);
  const { t } = useTranslation();

  const handleDeleteSuccess = useCallback(() => {
    if (isProcessingRef.current) {
      return;
    }
    
    isProcessingRef.current = true;
    try {
      cleanupRealtime();
      setIsItemDeleted(true);
      
      if (onOperationSuccess) {
        try {
          onOperationSuccess();
        } catch (error) {
          console.error("Error in onOperationSuccess callback:", error);
          toast({
            title: t('interactions.update_error'),
            description: t('interactions.update_error_description'),
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      console.error("Error handling delete success:", error);
      toast({
        title: t('interactions.warning'),
        description: t('interactions.warning_refresh'),
        variant: "destructive",
      });
    } finally {
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 500);
    }
  }, [onOperationSuccess, toast, cleanupRealtime, t]);

  return {
    isItemDeleted,
    setIsItemDeleted,
    handleDeleteSuccess,
    isProcessing: isProcessingRef.current
  };
};
