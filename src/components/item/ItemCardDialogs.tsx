
import { ItemDialogs } from "./dialogs/ItemDialogs";
import { useEffect } from "react";

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
  // Log state changes for debugging
  useEffect(() => {
    console.log("ItemCardDialogs - showDeleteDialog changed:", showDeleteDialog);
  }, [showDeleteDialog]);
  
  return (
    <ItemDialogs
      id={id}
      showDeleteDialog={showDeleteDialog}
      onCloseDeleteDialog={onCloseDeleteDialog}
      checkInterestedUsers={checkInterestedUsers}
      onDeleteSuccess={onDeleteSuccess}
    />
  );
}
