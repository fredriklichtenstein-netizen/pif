
import { useState, useEffect } from "react";
import { ItemDeleteDialog } from "../delete/ItemDeleteDialog";

interface ItemDialogsProps {
  id: string | number;
  showDeleteDialog: boolean;
  onCloseDeleteDialog: () => void;
  checkInterestedUsers?: () => Promise<number>;
  onDeleteSuccess: () => void;
}

export function ItemDialogs({
  id,
  showDeleteDialog,
  onCloseDeleteDialog,
  checkInterestedUsers,
  onDeleteSuccess
}: ItemDialogsProps) {
  // Local state to control dialog visibility
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Sync local state with parent prop
  useEffect(() => {
    setIsDeleteDialogOpen(showDeleteDialog);
  }, [showDeleteDialog]);
  
  // Handle dialog close safely
  const handleCloseDialog = () => {
    setIsDeleteDialogOpen(false);
    
    // Small delay to ensure dialog animations complete
    setTimeout(() => {
      onCloseDeleteDialog();
    }, 50);
  };

  return (
    <>
      <ItemDeleteDialog
        id={id}
        isOpen={isDeleteDialogOpen}
        onClose={handleCloseDialog}
        checkInterestedUsers={checkInterestedUsers}
        onSuccess={onDeleteSuccess}
      />
    </>
  );
}
