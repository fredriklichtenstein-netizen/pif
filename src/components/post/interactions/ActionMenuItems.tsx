
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
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  
  const handleEdit = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setTimeout(() => {
      if (onEdit) {
        onEdit();
      } else if (itemId) {
        navigate(`/post/edit/${itemId}`);
      }
    }, 10);
  }, [onEdit, itemId, navigate]);
  
  const handleDelete = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const dialogManager = getDeleteDialogManager();
    
    if (dialogManager && itemId) {
      dialogManager.openDeleteDialog({
        id: itemId,
        onSuccess: onDelete
      });
      return;
    }
    
    const deleteEvent = new CustomEvent("global-delete-dialog-open", {
      detail: { itemId, onSuccess: onDelete },
      bubbles: true,
      cancelable: true
    });
    
    document.dispatchEvent(deleteEvent);
    
    setTimeout(() => {
      if (onDelete) {
        onDelete();
      }
    }, 50);
  }, [itemId, onDelete]);

  return (
    <>
      {!isOwner && (
        <DropdownMenuItem onClick={onBookmarkToggle} className="cursor-pointer">
          {isBookmarked ? (
            <>
              <BookmarkCheck className="mr-2 h-4 w-4 text-primary" />
              <span>{t('interactions.remove_from_saved')}</span>
            </>
          ) : (
            <>
              <BookmarkPlus className="mr-2 h-4 w-4" />
              <span>{t('interactions.save')}</span>
            </>
          )}
        </DropdownMenuItem>
      )}
      
      <DropdownMenuItem onClick={onShare} className="cursor-pointer">
        <Share className="mr-2 h-4 w-4" />
        <span>{t('interactions.share')}</span>
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
            <span>{t('interactions.edit')}</span>
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={handleDelete} 
            className="cursor-pointer text-destructive focus:text-destructive"
            data-action="delete-item"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>{t('interactions.delete')}</span>
          </DropdownMenuItem>
        </>
      )}
      
      {!isOwner && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onReportClick} className="cursor-pointer text-destructive focus:text-destructive">
            <Flag className="mr-2 h-4 w-4" />
            <span>{t('interactions.report')}</span>
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
