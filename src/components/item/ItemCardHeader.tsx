
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ActionMenuItems } from "../post/interactions/ActionMenuItems";
import { MoreHorizontal, MapPin } from "lucide-react";
import { formatRelativeTime } from "@/utils/formatDate";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useCallback } from "react";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

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
  isBookmarked?: boolean;
  handleBookmark?: () => void;
  handleShare?: () => void;
}

export function ItemCardHeader({
  postedBy,
  createdAt,
  isOwner,
  handleReport,
  onEdit,
  onDelete,
  coordinates,
  itemId,
  isBookmarked = false,
  handleBookmark = () => {},
  handleShare = () => {}
}: ItemCardHeaderProps) {
  const navigate = useNavigate();
  
  // Direct delete handler that uses our global dialog manager
  const handleMenuDelete = useCallback(() => {
    console.log("Delete menu clicked in ItemCardHeader with itemId:", itemId);
    
    if (itemId) {
      // Try using the global dialog manager first
      const dialogManager = getDeleteDialogManager();
      
      if (dialogManager) {
        console.log("Using global dialog manager to open delete dialog");
        dialogManager.openDeleteDialog({
          id: itemId,
          onSuccess: onDelete
        });
        return;
      }
      
      // Fallback to the custom event if global manager not available
      console.log("Global dialog manager not available, using custom event");
      const deleteEvent = new CustomEvent("global-delete-dialog-open", {
        detail: { itemId, onSuccess: onDelete },
        bubbles: true,
        cancelable: true
      });
      
      document.dispatchEvent(deleteEvent);
    }
    
    // Also try the callback as a final fallback
    if (onDelete) {
      console.log("Calling onDelete callback from ItemCardHeader");
      setTimeout(() => {
        onDelete();
      }, 10);
    }
  }, [itemId, onDelete]);
  
  // More robust edit handler
  const handleMenuEdit = useCallback(() => {
    console.log("Edit menu clicked in ItemCardHeader");
    
    if (onEdit) {
      console.log("Calling onEdit callback from ItemCardHeader");
      setTimeout(() => {
        onEdit();
      }, 10);
    }
  }, [onEdit]);
  
  const handleUserClick = () => {
    if (postedBy?.id) {
      navigate(`/profile/${postedBy.id}`);
    }
  };

  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-2 cursor-pointer" onClick={handleUserClick}>
        <Avatar className="h-8 w-8">
          {postedBy?.avatar && <AvatarImage src={postedBy.avatar} alt={postedBy.name || "User"} />}
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
              isBookmarked={isBookmarked}
              isOwner={isOwner}
              itemId={itemId}
              onBookmarkToggle={handleBookmark} 
              onShare={handleShare} 
              onReportClick={handleReport}
              onEdit={handleMenuEdit}
              onDelete={handleMenuDelete} 
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
