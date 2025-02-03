import { Flag, Share2, Bookmark } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

interface ActionMenuItemsProps {
  isBookmarked: boolean;
  onBookmarkToggle: () => void;
  onShare: () => void;
  onReportClick: (e: React.MouseEvent) => void;
}

export function ActionMenuItems({
  isBookmarked,
  onBookmarkToggle,
  onShare,
  onReportClick,
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
      <DropdownMenuItem onSelect={(e) => e.preventDefault()} onClick={onReportClick}>
        <Flag className="mr-2 h-4 w-4" />
        Report
      </DropdownMenuItem>
    </>
  );
}