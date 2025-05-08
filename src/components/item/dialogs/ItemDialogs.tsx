
import { ItemDeleteDialog } from "../ItemDeleteDialog";

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
  return (
    <>
      <ItemDeleteDialog
        id={id}
        isOpen={showDeleteDialog}
        onClose={onCloseDeleteDialog}
        checkInterestedUsers={checkInterestedUsers}
        onSuccess={onDeleteSuccess}
      />
    </>
  );
}
