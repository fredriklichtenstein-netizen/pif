
import { useCallback, useState } from "react";

interface ItemDeleteDialogState {
  id: string | number;
  onSuccess?: () => void;
}

interface DeleteDialogInterface {
  currentDialog: ItemDeleteDialogState | null;
  openDeleteDialog: (props: ItemDeleteDialogState) => void;
  closeDeleteDialog: () => void;
}

// Global singleton to manage the delete dialog state
let globalDialogManager: DeleteDialogInterface | null = null;

// Set the global dialog manager instance
export const setDeleteDialogManager = (manager: DeleteDialogInterface | null) => {
  globalDialogManager = manager;
};

// Get the global dialog manager instance
export const getDeleteDialogManager = () => {
  return globalDialogManager;
};

// Custom hook to manage the delete dialog state
export const useItemDeleteDialog = () => {
  const [currentDialog, setCurrentDialog] = useState<ItemDeleteDialogState | null>(null);
  
  const openDeleteDialog = useCallback((props: ItemDeleteDialogState) => {
    setCurrentDialog(props);
  }, []);
  
  const closeDeleteDialog = useCallback(() => {
    setCurrentDialog(null);
  }, []);
  
  return {
    currentDialog,
    openDeleteDialog,
    closeDeleteDialog,
  };
};

// Hook to handle global delete dialog event
export const useGlobalDeleteDialogEvent = (onDeleteRequest: (itemId: string | number, onSuccess?: () => void) => void) => {
  const eventName = 'global-delete-dialog-open';
  
  const handleGlobalDeleteEvent = useCallback((event: CustomEvent<{ itemId: string | number; onSuccess?: () => void }>) => {
    const { itemId, onSuccess } = event.detail;
    onDeleteRequest(itemId, onSuccess);
  }, [onDeleteRequest]);
  
  return {
    attachGlobalDeleteEventListener: useCallback(() => {
      document.addEventListener(eventName, handleGlobalDeleteEvent as EventListener);
      return () => {
        document.removeEventListener(eventName, handleGlobalDeleteEvent as EventListener);
      };
    }, [handleGlobalDeleteEvent])
  };
};
