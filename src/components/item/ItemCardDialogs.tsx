
import { ItemDialogs } from "./dialogs/ItemDialogs";
import { useEffect, useState, useRef } from "react";

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
    
    return () => {
      isMounted.current = false;
    };
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
  
  // Add debug mount/unmount logging
  useEffect(() => {
    console.log(`ItemCardDialogs mounted for item ${id}`);
    return () => {
      console.log(`ItemCardDialogs unmounting for item ${id}`);
    };
  }, [id]);

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
