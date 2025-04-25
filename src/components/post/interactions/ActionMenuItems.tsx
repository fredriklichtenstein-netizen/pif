
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
  Flag 
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useItemBookmark } from "@/hooks/item/useItemBookmark";
import { useShare } from "@/hooks/useShare";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

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
  
  const handleShare = () => {
    onShare();
  };
  
  const handleEdit = () => {
    if (onEdit) {
      onEdit();
    } else if (itemId) {
      navigate(`/post/edit/${itemId}`);
    }
  };
  
  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    } else if (itemId && confirm("Are you sure you want to delete this item?")) {
      // Fallback deletion logic if onDelete is not provided
      // This should be replaced with proper deletion logic
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
      
      <DropdownMenuItem onClick={handleShare} className="cursor-pointer">
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
