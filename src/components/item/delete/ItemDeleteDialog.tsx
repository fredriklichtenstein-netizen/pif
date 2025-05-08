
import { useInterestedCount } from "./useInterestedCount";
import { useItemDeletion } from "./useItemDeletion";
import { DeleteConfirmDialog } from "@/components/common/DeleteConfirmDialog";

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
    handleDeleteConfirm 
  } = useItemDeletion(id, onClose, onSuccess);

  return (
    <DeleteConfirmDialog
      isOpen={isOpen}
      onClose={() => {
        // Only allow closing if not currently processing
        if (!isDeleting) onClose();
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
