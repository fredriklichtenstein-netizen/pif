
import { useEffect, useRef } from "react";
import { useItemDeleteDialog, setDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";
import { ItemDeleteDialog } from "./ItemDeleteDialog";

export function GlobalDeleteDialog() {
  const dialogManager = useItemDeleteDialog();
  const { currentDialog, closeDeleteDialog } = dialogManager;
  const mountedRef = useRef(true);

  // Register this instance as the global singleton
  useEffect(() => {
    console.log("GlobalDeleteDialog mounted, registering global instance");
    setDeleteDialogManager(dialogManager);
    
    return () => {
      console.log("GlobalDeleteDialog unmounting, cleaning up");
      setDeleteDialogManager(null);
      mountedRef.current = false;
    };
  }, [dialogManager]);
  
  // Force cleanup on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Reset any DOM manipulations when unmounting
      document.body.style.pointerEvents = '';
    };
  }, []);
  
  if (!currentDialog) {
    return null;
  }
  
  const { id, onSuccess } = currentDialog;
  
  const handleClose = () => {
    // Always force re-enable pointer events and interactions when dialog closes
    document.body.style.pointerEvents = '';
    
    // Only process if component is still mounted
    if (mountedRef.current) {
      // Then close dialog with slight delay to ensure state is updated properly
      closeDeleteDialog();
    }
  };
  
  return (
    <ItemDeleteDialog 
      id={id}
      isOpen={true}
      onClose={handleClose}
      onSuccess={onSuccess}
    />
  );
}
