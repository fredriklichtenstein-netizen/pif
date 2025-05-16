
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
  const dialogClosedManually = useRef(false);
  
  // Register with global dialog manager on mount
  useEffect(() => {
    console.log(`ItemCardDialogs mounted for item ${id}`);
    
    // Reset state on mount
    dialogClosedManually.current = false;
    
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
      
      // Reset any DOM manipulations when unmounting
      document.body.style.pointerEvents = '';
    };
  }, [id]);
  
  // Force dialog open status when prop changes
  useEffect(() => {
    if (isMounted.current) {
      console.log(`ItemCardDialogs - showDeleteDialog changed to: ${showDeleteDialog}`);
      
      if (showDeleteDialog && !dialogClosedManually.current) {
        console.log("Setting dialog to open immediately");
        setIsDialogOpen(true);
      } else if (!showDeleteDialog) {
        setIsDialogOpen(false);
        // Reset the manual close flag when parent explicitly closes
        dialogClosedManually.current = false;
      }
    }
  }, [showDeleteDialog]);
  
  // Handle safe close with consistent behavior
  const handleDialogClose = () => {
    console.log("ItemCardDialogs - handleDialogClose called");
    setIsDialogOpen(false);
    
    // Mark as manually closed
    dialogClosedManually.current = true;
    
    // Reset any DOM manipulations
    document.body.style.pointerEvents = '';
    
    // Call parent callback with a slight delay to prevent race conditions
    if (isMounted.current) {
      // Use timeout to prevent race conditions in React's event handling
      setTimeout(() => {
        if (isMounted.current) {
          onCloseDeleteDialog();
        }
      }, 10);
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
