
import { 
  DropdownMenuItem,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { 
  BookmarkPlus, 
  BookmarkCheck, 
  Share, 
  Pencil, 
  Trash2, 
  Flag,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

interface ActionMenuItemsProps {
  isBookmarked: boolean;
  isOwner: boolean;
  itemId?: number | string;
  onBookmarkToggle: () => void;
  onShare: () => void;
  onReportClick: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActionMenuItems({
  isBookmarked,
  isOwner,
  itemId,
  onBookmarkToggle,
  onShare,
  onReportClick,
  onEdit,
  onDelete
}: ActionMenuItemsProps) {
  const navigate = useNavigate();
  
  const handleEdit = (e: React.MouseEvent) => {
    // Prevent default behavior
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Edit clicked in ActionMenuItems");
    
    // Add a small delay to ensure the dropdown closes properly
    setTimeout(() => {
      if (onEdit) {
        onEdit();
      } else if (itemId) {
        navigate(`/post/edit/${itemId}`);
      }
    }, 10);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    // Prevent default behavior
    e.preventDefault();
    e.stopPropagation();
    
    console.log("Delete clicked in ActionMenuItems for item:", itemId);
    
    // Try to use the global dialog manager first (most direct approach)
    const dialogManager = getDeleteDialogManager();
    
    if (dialogManager && itemId) {
      console.log("Using global dialog manager to open delete dialog");
      dialogManager.openDeleteDialog({
        id: itemId,
        onSuccess: onDelete
      });
      return;
    }
    
    // Fallback to the custom event approach if global manager not ready
    console.log("Global dialog manager not available, using custom event");
    const deleteEvent = new CustomEvent("global-delete-dialog-open", {
      detail: { itemId, onSuccess: onDelete },
      bubbles: true,
      cancelable: true
    });
    
    document.dispatchEvent(deleteEvent);
    
    // Also try the regular callback as a final fallback
    setTimeout(() => {
      if (onDelete) {
        console.log("Calling onDelete callback");
        onDelete();
      }
    }, 10);
  };

  return (
    <>
      {!isOwner && (
        <DropdownMenuItem onClick={onBookmarkToggle} className="cursor-pointer">
          {isBookmarked ? (
            <>
              <BookmarkCheck className="mr-2 h-4 w-4 text-primary" />
              <span>Remove from saved</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              <span>Save</span>
            </>
          )}
        </DropdownMenuItem>
      )}
      
      <DropdownMenuItem onClick={onShare} className="cursor-pointer">
        <Share className="mr-2 h-4 w-4" />
        <span>Share</span>
      </DropdownMenuItem>
      
      {isOwner && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            onClick={handleEdit} 
            className="cursor-pointer"
            data-action="edit-item"
          >
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="cursor-pointer text-destructive focus:text-destructive"
            data-action="delete-item"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </DropdownMenuItem>
        </>
      )}
      
      {!isOwner && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onReportClick} className="cursor-pointer text-destructive focus:text-destructive">
            <Flag className="mr-2 h-4 w-4" />
            <span>Report</span>
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
