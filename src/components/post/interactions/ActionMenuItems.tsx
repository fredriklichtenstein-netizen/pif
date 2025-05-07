
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
  Archive,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

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
    e.preventDefault();
    e.stopPropagation();
    if (onEdit) {
      onEdit();
    } else if (itemId) {
      navigate(`/post/edit/${itemId}`);
    }
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onDelete) {
      onDelete();
    }
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
          <DropdownMenuItem onClick={handleEdit} className="cursor-pointer">
            <Pencil className="mr-2 h-4 w-4" />
            <span>Edit</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDelete} className="cursor-pointer text-destructive focus:text-destructive">
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
