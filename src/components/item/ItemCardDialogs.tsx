
import { ItemDialogs } from "./dialogs/ItemDialogs";
import { useEffect, useState, useRef } from "react";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

interface ItemCardDialogsProps {
  id: string | number;
  showDeleteDialog: boolean;
  onCloseDeleteDialog: () => void;
  checkInterestedUsers?: () => Promise<number>;
  onDeleteSuccess: () => void;
}

export function ItemCardDialogs({
  id,
  showDeleteDialog,
  onCloseDeleteDialog,
  checkInterestedUsers,
  onDeleteSuccess
}: ItemCardDialogsProps) {
  // Local state to track dialog visibility
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Track mount status
  const isMounted = useRef(true);
  
  // Register with global dialog manager on mount
  useEffect(() => {
    console.log(`ItemCardDialogs mounted for item ${id}`);
    
    // Listen for global dialog events as a fallback mechanism
    const handleGlobalDialogEvent = (event: CustomEvent) => {
      const eventId = event.detail?.id || event.detail?.itemId;
      
      if ((eventId === id || eventId === String(id)) && isMounted.current) {
        console.log(`ItemCardDialogs caught global dialog event for item ${id}`);
        setIsDialogOpen(true);
      }
    };
    
    document.addEventListener("global-delete-dialog-open", handleGlobalDialogEvent as EventListener);
    
    return () => {
      console.log(`ItemCardDialogs unmounting for item ${id}`);
      isMounted.current = false;
      document.removeEventListener("global-delete-dialog-open", handleGlobalDialogEvent as EventListener);
    };
  }, [id]);
  
  // Force dialog open status when prop changes
  useEffect(() => {
    if (isMounted.current) {
      console.log(`ItemCardDialogs - showDeleteDialog changed to: ${showDeleteDialog}`);
      
      if (showDeleteDialog) {
        console.log("Setting dialog to open immediately");
        setIsDialogOpen(true);
      } else {
        setIsDialogOpen(false);
      }
    }
  }, [showDeleteDialog]);
  
  // Handle safe close with consistent behavior
  const handleDialogClose = () => {
    console.log("ItemCardDialogs - handleDialogClose called");
    setIsDialogOpen(false);
    
    // Call parent callback
    if (isMounted.current) {
      onCloseDeleteDialog();
    }
  };

  return (
    <ItemDialogs
      id={id}
      showDeleteDialog={isDialogOpen}
      onCloseDeleteDialog={handleDialogClose}
      checkInterestedUsers={checkInterestedUsers}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
}
