
import { MapPin, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent } from "../ui/dropdown-menu";
import { ActionMenuItems } from "../post/interactions/ActionMenuItems";
import { Link } from "react-router-dom";
import { useItemBookmark } from "@/hooks/item/useItemBookmark";
import { useShare } from "@/hooks/useShare";

interface ItemCardHeaderProps {
  postedBy: {
    id?: string;
    name: string;
    avatar: string;
  };
  isOwner: boolean;
  handleReport: (e: React.MouseEvent) => void;
  coordinates?: {
    lat: number;
    lng: number;
  };
  itemId?: number;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ItemCardHeader({
  postedBy,
  isOwner,
  handleReport,
  coordinates,
  itemId = 0,
  onEdit,
  onDelete
}: ItemCardHeaderProps) {
  const { isBookmarked, toggleBookmark } = useItemBookmark(itemId);
  const { shareContent } = useShare();
  
  const distanceText = "Nearby"; // This should be calculated based on user location and coordinates
  
  const handleShare = () => {
    const shareUrl = `${window.location.origin}/item/${itemId}`;
    shareContent({
      title: `Check out this item on PIF`,
      text: `Check out what ${postedBy.name} is sharing on PIF Community!`,
      url: shareUrl
    });
  };
  
  return (
    <div className="p-3 flex items-center justify-between">
      {postedBy.id ? (
        <Link to={`/user/${postedBy.id}`} className="flex items-center">
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
        </Link>
      ) : (
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
      )}
      
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
            itemId={itemId}
            onBookmarkToggle={toggleBookmark}
            onShare={handleShare}
            onReportClick={handleReport}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
