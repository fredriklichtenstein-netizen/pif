
import { MapPin, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "../ui/dropdown-menu";
import { ActionMenuItems } from "./interactions/ActionMenuItems";

interface UserInfoHeaderProps {
  postedBy: {
    id?: string;
    name: string;
    avatar: string;
  };
  distanceText: string;
  isOwner: boolean;
  isBookmarked: boolean;
  handleBookmark: () => void;
  handleShare: () => void;
  handleReport: () => void;
}

export function UserInfoHeader({
  postedBy,
  distanceText,
  isOwner,
  isBookmarked,
  handleBookmark,
  handleShare,
  handleReport
}: UserInfoHeaderProps) {
  return (
    <div className="p-3 flex items-center justify-between">
      <div className="flex items-center">
        <Avatar className="h-8 w-8 mr-2">
          <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
          <AvatarFallback>{postedBy.name[0]}</AvatarFallback>
        </Avatar>
        <div>
          <div className="text-sm font-medium">{postedBy.name}</div>
          {distanceText && (
            <div className="text-xs text-gray-500 flex items-center">
              <MapPin size={12} className="mr-1" />
              {distanceText}
            </div>
          )}
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
