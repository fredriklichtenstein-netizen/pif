
import { useState, useEffect, useRef } from "react";
import { ItemDeleteDialog } from "../delete/ItemDeleteDialog";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

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
  
  // Debug references for internal state tracking
  const debugStateRef = useRef({
    initialRender: true,
    forcedOpen: false,
    lastPropState: showDeleteDialog,
    lastRenderTime: Date.now()
  });
  
  console.log(`ItemDialogs render - showDeleteDialog: ${showDeleteDialog}, isDeleteDialogOpen: ${isDeleteDialogOpen}`);
  
  // Direct synchronization with props
  useEffect(() => {
    console.log(`ItemDialogs useEffect - showDeleteDialog changed to: ${showDeleteDialog}`);
    
    if (showDeleteDialog) {
      console.log("ItemDialogs - Opening delete dialog");
      setIsDeleteDialogOpen(true);
    }
  }, [showDeleteDialog]);
  
  // Handle dialog close with consistent behavior
  const handleCloseDialog = () => {
    console.log("ItemDialogs - handleCloseDialog called");
    
    // First update local state
    setIsDeleteDialogOpen(false);
    
    // Then notify parent - delay to avoid race conditions
    setTimeout(() => {
      onCloseDeleteDialog();
    }, 10);
  };

  return (
    <ItemDeleteDialog
      id={id}
      isOpen={isDeleteDialogOpen}
      onClose={handleCloseDialog}
      checkInterestedUsers={checkInterestedUsers}
      onSuccess={onDeleteSuccess}
    />
  );
}
