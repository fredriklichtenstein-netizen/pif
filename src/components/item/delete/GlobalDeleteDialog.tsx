
import { useEffect } from "react";
import { useItemDeleteDialog, setDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";
import { ItemDeleteDialog } from "./ItemDeleteDialog";

export function GlobalDeleteDialog() {
  const dialogManager = useItemDeleteDialog();
  const { currentDialog, closeDeleteDialog } = dialogManager;
  
  // Register this instance as the global singleton
  useEffect(() => {
    console.log("GlobalDeleteDialog mounted, registering global instance");
    setDeleteDialogManager(dialogManager);
    
    return () => {
      console.log("GlobalDeleteDialog unmounting, cleaning up");
      setDeleteDialogManager(null);
    };
  }, [dialogManager]);

  // Debug info
  useEffect(() => {
    console.log("Dialog state changed:", currentDialog ? "open" : "closed");
  }, [currentDialog]);
  
  if (!currentDialog) {
    return null;
  }
  
  const { id, onSuccess } = currentDialog;
  
  const handleClose = () => {
    // Always force re-enable pointer events and interactions when dialog closes
    document.body.style.pointerEvents = '';
    
    // Then close dialog
    closeDeleteDialog();
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
