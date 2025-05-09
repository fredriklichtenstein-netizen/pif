
import { useState, useEffect, useRef } from "react";
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
  const initialRender = useRef(true);
  const forcedOpen = useRef(false);
  
  console.log(`ItemDialogs render - showDeleteDialog: ${showDeleteDialog}, isDeleteDialogOpen: ${isDeleteDialogOpen}`);
  
  // Sync local state with parent prop immediately on first render
  useEffect(() => {
    if (initialRender.current) {
      initialRender.current = false;
      setIsDeleteDialogOpen(showDeleteDialog);
      return;
    }

    // On subsequent renders, track state changes
    console.log(`ItemDialogs useEffect - showDeleteDialog changed to: ${showDeleteDialog}`);
    
    if (showDeleteDialog) {
      console.log("ItemDialogs - Opening delete dialog");
      forcedOpen.current = true;
      setIsDeleteDialogOpen(true);
    } else if (!forcedOpen.current) {
      setIsDeleteDialogOpen(false);
    }
  }, [showDeleteDialog]);
  
  // Handle dialog close with consistent behavior
  const handleCloseDialog = () => {
    console.log("ItemDialogs - handleCloseDialog called");
    setIsDeleteDialogOpen(false);
    forcedOpen.current = false;
    
    // Call parent callback
    onCloseDeleteDialog();
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
