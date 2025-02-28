
import { Flag, Share2, Bookmark, Pencil, Trash2 } from "lucide-react";
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";

interface ActionMenuItemsProps {
  isBookmarked: boolean;
  isOwner?: boolean;
  isDeleting?: boolean;
  onBookmarkToggle: () => void;
  onShare: () => void;
  onReportClick: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ActionMenuItems({
  isBookmarked,
  isOwner = false,
  isDeleting = false,
  onBookmarkToggle,
  onShare,
  onReportClick,
  onEdit,
  onDelete,
}: ActionMenuItemsProps) {
  return (
    <>
      <DropdownMenuItem onClick={onBookmarkToggle}>
        <Bookmark className={`mr-2 h-4 w-4 ${isBookmarked ? "fill-current" : ""}`} />
        {isBookmarked ? "Saved" : "Save item"}
      </DropdownMenuItem>
      <DropdownMenuItem onClick={onShare}>
        <Share2 className="mr-2 h-4 w-4" />
        Share
      </DropdownMenuItem>
      
      {isOwner && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onEdit}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            {isDeleting ? "Deleting..." : "Delete"}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
        </>
      )}
      
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={onReportClick}>
        <Flag className="mr-2 h-4 w-4" />
        Report
      </DropdownMenuItem>
    </>
  );
}
