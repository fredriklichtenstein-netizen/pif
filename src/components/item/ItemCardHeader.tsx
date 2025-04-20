
import { MapPin, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "../ui/dropdown-menu";
import { ActionMenuItems } from "../post/interactions/ActionMenuItems";
import type { ItemCardHeaderProps } from "./types";
import { useDistanceCalculation } from "@/hooks/useDistanceCalculation";

export function ItemCardHeader({
  postedBy,
  isOwner,
  isBookmarked,
  handleBookmark,
  handleShare,
  handleReport,
  coordinates
}: ItemCardHeaderProps) {
  // Add console logs to debug coordinates
  console.log("ItemCardHeader coordinates:", coordinates);
  
  const distanceText = useDistanceCalculation(coordinates);
  
  return (
    <div className="p-3 flex items-center justify-between">
      <div className="flex items-center">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
          <AvatarFallback>{postedBy.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-sm font-medium">{postedBy.name}</div>
          <div className="text-xs text-gray-500 flex items-center">
            <MapPin size={12} className="mr-1" />
            {distanceText || "NaN km"}
          </div>
        </div>
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <ActionMenuItems
            isBookmarked={isBookmarked}
            isOwner={isOwner}
            onBookmarkToggle={handleBookmark}
            onShare={handleShare}
            onReportClick={handleReport}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
