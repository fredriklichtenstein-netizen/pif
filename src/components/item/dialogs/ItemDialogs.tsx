
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
  
  // Log for debugging
  console.log(`ItemDialogs render - showDeleteDialog: ${showDeleteDialog}, isDeleteDialogOpen: ${isDeleteDialogOpen}`);
  
  // Simplify state management - force immediate sync with parent props
  useEffect(() => {
    const currentState = debugStateRef.current;
    
    // Log detailed state transitions for debugging
    console.log(`ItemDialogs useEffect - showDeleteDialog changed to: ${showDeleteDialog}`, {
      previousState: currentState.lastPropState,
      currentState: showDeleteDialog,
      isInitialRender: currentState.initialRender,
      timeSinceLastRender: Date.now() - currentState.lastRenderTime
    });
    
    // Update debug state
    currentState.lastPropState = showDeleteDialog;
    currentState.lastRenderTime = Date.now();
    
    // Direct synchronization with props
    if (showDeleteDialog) {
      console.log("ItemDialogs - Opening delete dialog");
      currentState.forcedOpen = true;
      setIsDeleteDialogOpen(true);
    } else {
      if (currentState.initialRender) {
        currentState.initialRender = false;
      } else if (!currentState.forcedOpen) {
        setIsDeleteDialogOpen(false);
      }
    }
    
    // Listen for direct dialog open events from the global system
    const handleGlobalDialogOpen = (event: CustomEvent) => {
      const eventId = event.detail?.id || event.detail?.itemId;
      
      if (eventId === id || eventId === String(id)) {
        console.log("ItemDialogs - Received global dialog open event");
        setIsDeleteDialogOpen(true);
      }
    };
    
    document.addEventListener("global-delete-dialog-open", handleGlobalDialogOpen as EventListener);
    
    return () => {
      document.removeEventListener("global-delete-dialog-open", handleGlobalDialogOpen as EventListener);
    };
  }, [showDeleteDialog, id]);
  
  // Handle dialog close with consistent behavior
  const handleCloseDialog = () => {
    console.log("ItemDialogs - handleCloseDialog called");
    setIsDeleteDialogOpen(false);
    debugStateRef.current.forcedOpen = false;
    
    // Call parent callback
    onCloseDeleteDialog();
  };

  // Register with global dialog manager for direct control
  useEffect(() => {
    const dialogManager = getDeleteDialogManager();
    
    if (dialogManager) {
      // Check if dialog should be open based on global state
      const shouldBeOpen = dialogManager.isDialogActive(id);
      
      if (shouldBeOpen && !isDeleteDialogOpen) {
        console.log("ItemDialogs - Global dialog manager indicates dialog should be open");
        setIsDeleteDialogOpen(true);
      }
    }
  }, [id, isDeleteDialogOpen]);

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
