
import { useInterestedCount } from "./useInterestedCount";
import { useItemDeletion } from "./useItemDeletion";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";
import { useEffect } from "react";

interface ItemDeleteDialogProps {
  id: string | number;
  isOpen: boolean;
  onClose: () => void;
  checkInterestedUsers?: () => Promise<number>;
  onSuccess?: () => void;
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
  // Get interested count functionality
  const { 
    isLoadingCount, 
    interestedCount 
  } = useInterestedCount(id, isOpen, checkInterestedUsers);
  
  // Get deletion functionality
  const { 
    isDeleting, 
    handleDeleteConfirm,
    isOperationComplete
  } = useItemDeletion(id, onClose, onSuccess);

  // Add a cleanup effect to ensure proper state reset
  useEffect(() => {
    if (!isOpen) {
      // Ensure body styling is reset when dialog closes
      document.body.style.pointerEvents = '';
    }
    
    return () => {
      // Ensure cleanup on unmount
      document.body.style.pointerEvents = '';
    };
  }, [isOpen]);
  
  // Force a reflow/refresh to fix unresponsiveness after operation
  useEffect(() => {
    if (isOperationComplete) {
      // Force body style reset
      document.body.style.pointerEvents = '';
    }
  }, [isOperationComplete]);

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        // Only allow closing if not currently processing
        if (!isDeleting) {
          // Force body style reset before closing
          document.body.style.pointerEvents = '';
          onClose();
        }
      }}
      onConfirm={handleDeleteConfirm}
      title="Delete Item"
      description="Are you sure you want to delete this item? This action may not be reversible."
      hasInterestedUsers={isLoadingCount ? false : interestedCount > 0}
      interestCount={isLoadingCount ? 0 : interestedCount}
      isLoading={isDeleting}
      isLoadingInterested={isLoadingCount}
    />
  );
}
