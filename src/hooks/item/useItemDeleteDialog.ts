
import { useState, useCallback, useEffect } from "react";

type DialogProps = {
  id: string | number;
  onSuccess?: () => void;
};

const activeDialogs = new Map<string, boolean>();

export const useItemDeleteDialog = () => {
  const [currentDialog, setCurrentDialog] = useState<DialogProps | null>(null);

  // Direct method to open the dialog from anywhere in the app
  const openDeleteDialog = useCallback((props: DialogProps) => {
    console.log("useItemDeleteDialog - openDeleteDialog called for item:", props.id);
    
    // Store in global state
    const itemKey = `item-${props.id}`;
    activeDialogs.set(itemKey, true);
    
    // Update local state
    setCurrentDialog(props);
    
    // Debug info
    console.log("Active dialogs:", Array.from(activeDialogs.keys()));
    
    // Also dispatch a DOM event as a fallback trigger mechanism
    document.dispatchEvent(
      new CustomEvent("global-delete-dialog-open", { 
        detail: props,
        bubbles: true
      })
    );
  }, []);
  
  // Method to close the dialog
  const closeDeleteDialog = useCallback(() => {
    if (currentDialog) {
      const itemKey = `item-${currentDialog.id}`;
      activeDialogs.delete(itemKey);
    }
    setCurrentDialog(null);
  }, [currentDialog]);

  // Global event listener as a fallback mechanism
  useEffect(() => {
    const handleGlobalOpen = (event: CustomEvent) => {
      console.log("Global delete dialog event received:", event.detail);
      setCurrentDialog(event.detail);
    };
    
    document.addEventListener(
      "global-delete-dialog-open", 
      handleGlobalOpen as EventListener
    );
    
    return () => {
      document.removeEventListener(
        "global-delete-dialog-open", 
        handleGlobalOpen as EventListener
      );
    };
  }, []);

  return {
    currentDialog,
    openDeleteDialog,
    closeDeleteDialog,
    isDialogActive: (id: string | number) => 
      activeDialogs.has(`item-${id}`)
  };
};

// Create a singleton instance for global access
let dialogInstance: ReturnType<typeof useItemDeleteDialog> | null = null;

// This allows direct access without React context in some cases
export const getDeleteDialogManager = () => {
  return dialogInstance;
};

export const setDeleteDialogManager = (instance: ReturnType<typeof useItemDeleteDialog>) => {
  dialogInstance = instance;
};
