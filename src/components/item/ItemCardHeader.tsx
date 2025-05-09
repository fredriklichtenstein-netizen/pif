
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionMenuItems } from "../post/interactions/ActionMenuItems";
import { MoreHorizontal, MapPin } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatDate";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

interface ItemCardHeaderProps {
  postedBy: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  createdAt?: string;
  isOwner: boolean;
  handleReport: (e: React.MouseEvent) => void;
  onEdit?: () => void;
  onDelete?: () => void;
  coordinates?: {
    lat: number;
    lng: number;
  };
  itemId?: number;
}

export function ItemCardHeader({
  postedBy,
  createdAt,
  isOwner,
  handleReport,
  onEdit,
  onDelete,
  coordinates,
  itemId
}: ItemCardHeaderProps) {
  const navigate = useNavigate();
  
  const handleMenuDelete = () => {
    console.log("Delete menu clicked in ItemCardHeader");
    if (onDelete) {
      onDelete();
    }
  };
  
  const handleUserClick = () => {
    if (postedBy?.id) {
      navigate(`/profile/${postedBy.id}`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={handleUserClick}>
        <Avatar className="h-8 w-8">
          <AvatarImage src={postedBy?.avatar} alt={postedBy?.name || "User"} />
          <AvatarFallback>{postedBy?.name?.[0] || '?'}</AvatarFallback>
        </Avatar>
        <div>
          <div className="font-medium text-sm">{postedBy?.name || "Unknown User"}</div>
          {createdAt && (
            <div className="text-xs text-gray-500">{formatRelativeTime(new Date(createdAt))}</div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-1">
        {coordinates && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8" 
            onClick={() => navigate(`/map?lat=${coordinates.lat}&lng=${coordinates.lng}`)}
          >
            <MapPin className="h-4 w-4 text-gray-500" />
            <span className="sr-only">View on map</span>
          </Button>
        )}
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreHorizontal className="h-4 w-4" />
              <span className="sr-only">More options</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <ActionMenuItems 
              isBookmarked={false}
              isOwner={isOwner}
              itemId={itemId}
              onBookmarkToggle={() => {}} 
              onShare={() => {}} 
              onReportClick={handleReport}
              onEdit={onEdit}
              onDelete={handleMenuDelete} // Use our special handler
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
