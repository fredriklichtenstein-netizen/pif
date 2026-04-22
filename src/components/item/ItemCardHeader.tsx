
import { MapPin, MoreVertical } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { SimpleDeleteDialog } from "./delete/SimpleDeleteDialog";
import { BookmarkPlus, BookmarkCheck, Flag, Archive, Trash2, Pencil } from "lucide-react";
import { useItemSharing } from "@/hooks/item/useItemSharing";

interface ItemCardHeaderProps {
  postedBy: {
    id?: string;
    name: string;
    avatar?: string;
  };
  itemId: string | number;
  itemTitle?: string;
  distanceText?: string;
  location?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isOwner: boolean;
  isBookmarked: boolean;
  isArchived?: boolean;
  handleBookmark?: () => void;
  handleShare?: () => void;
  handleReport?: (e: React.MouseEvent) => void;
  handleEdit?: () => void;
  handleDeleteClick?: () => void;
  onDeleteSuccess?: () => void;
}

export function ItemCardHeader({
  postedBy,
  itemId,
  itemTitle,
  distanceText,
  location,
  coordinates,
  isOwner,
  isBookmarked,
  isArchived = false,
  handleBookmark,
  handleShare,
  handleReport,
  handleEdit,
  handleDeleteClick,
  onDeleteSuccess
}: ItemCardHeaderProps) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { handleShare: shareItem } = useItemSharing(String(itemId));
  
  const handleBookmarkClick = async () => {
    // Check authentication
    if (!handleBookmark) return;
    
    handleBookmark();
  };

  const handleReportClick = async () => {
    if (!handleReport) return;
    
    handleReport({} as React.MouseEvent);
  };
  
  const handleLocalDeleteClick = () => {
    // Always use the local SimpleDeleteDialog. The legacy `handleDeleteClick`
    // path routes to a GlobalDeleteDialog that isn't mounted in the active
    // feed/profile tree, which would silently break archive/delete UX.
    setShowDeleteDialog(true);
  };
  
  const handleEditClick = () => {
    if (handleEdit) {
      handleEdit();
    } else if (isOwner && itemId) {
      navigate(`/post/edit/${itemId}`);
    }
  };

  const handleLocationClick = () => {
    if (itemId) {
      navigate(`/map?item=${itemId}`);
    }
  };

  return (
    <>
      <div className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {postedBy.id ? (
            <Link to={`/user/${postedBy.id}`} className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
                <AvatarFallback>{postedBy.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">{postedBy.name}</div>
            </Link>
          ) : (
            <div className="flex items-center">
              <Avatar className="h-8 w-8 mr-2">
                <AvatarImage src={postedBy.avatar} alt={postedBy.name} />
                <AvatarFallback>{postedBy.name[0]}</AvatarFallback>
              </Avatar>
              <div className="text-sm font-medium">{postedBy.name}</div>
            </div>
          )}
          {distanceText && (
            <button
              onClick={handleLocationClick}
              className="text-xs text-gray-500 flex items-center hover:text-primary transition-colors"
            >
              <MapPin size={12} className="mr-1" />
              {distanceText}
            </button>
          )}
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {isOwner ? (
              <>
                <DropdownMenuItem onClick={handleEditClick}>
                  <Pencil className="mr-2 h-4 w-4" />
                  {t('ui.edit')}
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={handleLocalDeleteClick}
                  className={isArchived ? "text-primary" : "text-destructive"}
                >
                  {isArchived ? (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{t('ui.delete_archived_item')}</span>
                    </>
                  ) : (
                    <>
                      <Archive className="mr-2 h-4 w-4" />
                      <span>{t('ui.archive')}</span>
                    </>
                  )}
                </DropdownMenuItem>
              </>
            ) : (
              <>
                {handleBookmark && (
                  <DropdownMenuItem onClick={handleBookmarkClick}>
                    {isBookmarked ? (
                      <>
                        <BookmarkCheck className="mr-2 h-4 w-4" />
                        <span>{t('ui.unsave')}</span>
                      </>
                    ) : (
                      <>
                        <BookmarkPlus className="mr-2 h-4 w-4" />
                        <span>{t('ui.save')}</span>
                      </>
                    )}
                  </DropdownMenuItem>
                )}
                
                {handleReport && (
                  <DropdownMenuItem onClick={handleReportClick} className="text-destructive">
                    <Flag className="mr-2 h-4 w-4" />
                    <span>{t('ui.report')}</span>
                  </DropdownMenuItem>
                )}
              </>
            )}
            
            <DropdownMenuItem onClick={() => shareItem()}>
              <span>{t('interactions.share')}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      
      <SimpleDeleteDialog 
        itemId={itemId}
        itemTitle={itemTitle}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onSuccess={onDeleteSuccess}
        isArchived={isArchived}
        archiveOnly={!isArchived}
      />
    </>
  );
}
