
import { ItemDialogs } from "./dialogs/ItemDialogs";

export function ItemCardDialogs({
  id,
  showDeleteDialog,
  onCloseDeleteDialog,
  checkInterestedUsers,
  onDeleteSuccess
}) {
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
