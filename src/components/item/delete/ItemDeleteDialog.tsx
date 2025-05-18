
import { useItemDeletion } from "./useItemDeletion";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useInterestedCount } from "./useInterestedCount";

interface ItemDeleteDialogProps {
  id: string | number;
  isOpen: boolean;
  onClose: () => void;
  checkInterestedUsers?: () => Promise<number>;
  onSuccess?: (operationType?: 'delete' | 'archive') => void;
}

/**
 * Dialog component for deleting or archiving an item
 */
export function ItemDeleteDialog({ 
  id, 
  isOpen, 
  onClose,
  checkInterestedUsers,
  onSuccess
}: ItemDeleteDialogProps) {
  const mountedRef = useRef(true);
  const [showInterestInfo, setShowInterestInfo] = useState(false);
  
  // Use the optimized interest count hook
  const {
    isLoadingCount,
    interestedCount,
    countError
  } = useInterestedCount(id, isOpen, checkInterestedUsers);
  
  // Get deletion functionality
  const { 
    isDeleting, 
    handleDeleteConfirm,
    isOperationComplete,
    cleanupState
  } = useItemDeletion(id, onClose, onSuccess);

  // Show interest info when count is loaded and greater than 0
  useEffect(() => {
    if (interestedCount > 0) {
      setShowInterestInfo(true);
    } else {
      setShowInterestInfo(false);
    }
  }, [interestedCount]);

  // Ensure cleanup happens on unmount
  useEffect(() => {
    return () => {
      // Mark component as unmounted
      mountedRef.current = false;
      
      // Always ensure body styling is reset
      document.body.style.pointerEvents = '';
      
      // Run cleanup
      cleanupState();
    };
  }, [cleanupState]);
  
  // Reset styling when dialog state changes
  useEffect(() => {
    if (!isOpen) {
      document.body.style.pointerEvents = '';
    }
    
    // Always run cleanup when dialog closes
    if (!isOpen && mountedRef.current) {
      cleanupState();
    }
  }, [isOpen, cleanupState]);
  
  // Force a reflow/refresh to fix unresponsiveness after operation
  useEffect(() => {
    if (isOperationComplete && mountedRef.current) {
      // Force body style reset
      document.body.style.pointerEvents = '';
      
      // Clean up state
      cleanupState();
    }
  }, [isOperationComplete, cleanupState]);

  // Only render if open
  if (!isOpen) return null;

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        // Only allow closing if not currently processing
        if (!isDeleting && mountedRef.current) {
          // Force body style reset before closing
          document.body.style.pointerEvents = '';
          onClose();
        }
      }}
      onConfirm={handleDeleteConfirm}
      title="Delete Item"
      description="Are you sure you want to delete this item? This action may not be reversible."
      hasInterestedUsers={showInterestInfo && interestedCount > 0}
      interestCount={interestedCount}
      isLoading={isDeleting}
      isLoadingInterested={false} // We're not showing the loading state anymore
    />
  );
}
