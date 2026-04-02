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
  
  // Keep track of component mount state
  const isMounted = useRef(true);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
      
      // Reset any DOM manipulations when unmounting
      document.body.style.pointerEvents = '';
    };
  }, []);
  
  // Direct synchronization with props
  useEffect(() => {
    if (showDeleteDialog && isMounted.current) {
      setIsDeleteDialogOpen(true);
    } else if (!showDeleteDialog && isMounted.current) {
      setIsDeleteDialogOpen(false);
    }
  }, [showDeleteDialog]);
  
  // Handle dialog close with consistent behavior
  const handleCloseDialog = () => {
    // First update local state
    if (isMounted.current) {
      setIsDeleteDialogOpen(false);
    }
    
    // Reset any DOM manipulations
    document.body.style.pointerEvents = '';
    
    // Then notify parent - delay to avoid race conditions
    setTimeout(() => {
      if (isMounted.current) {
        onCloseDeleteDialog();
      }
    }, 10);
  };

  // This prevents the dialog from appearing when not wanted
  // but allows it to show when requested
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
