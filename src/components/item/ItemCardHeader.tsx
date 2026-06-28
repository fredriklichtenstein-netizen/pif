
import { MapPin, MoreVertical } from "lucide-react";
import { AvatarImage } from "../ui/optimized-image";
import { Button } from "../ui/button";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "../ui/dropdown-menu";
import { useUserFilterProfileStore } from "@/stores/userFilterProfileStore";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { SimpleDeleteDialog } from "./delete/SimpleDeleteDialog";
import { BookmarkPlus, BookmarkCheck, Flag, Archive, Trash2, Pencil, RotateCcw } from "lucide-react";
import { useItemSharing } from "@/hooks/item/useItemSharing";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { clearPostsCache } from "@/services/posts/optimized";

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
  const { session } = useGlobalAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { handleShare: shareItem } = useItemSharing(String(itemId));
  const isAuthenticated = !!session?.user;
  const queryClient = useQueryClient();

  const handleRestoreClick = async () => {
    if (isRestoring) return;
    setIsRestoring(true);
    try {
      const numericId = typeof itemId === 'number' ? itemId : parseInt(String(itemId), 10);
      const { error: rpcError } = await (supabase as any).rpc('restore_item', { p_item_id: numericId });
      if (rpcError) {
        const { error: updateError } = await (supabase
          .from('items')
          .update({ pif_status: 'active', archived_at: null, archived_reason: null } as any) as any)
          .eq('id', numericId);
        if (updateError) throw updateError;
      }
      try {
        clearPostsCache();
        queryClient.removeQueries({ queryKey: ['posts', 'optimized'] });
        queryClient.invalidateQueries({ queryKey: ['posts'] });
      } catch (e) { console.error('feed cache invalidation failed', e); }
      try {
        document.dispatchEvent(new CustomEvent('item-operation-success', {
          detail: { itemId: numericId, operationType: 'restore' },
        }));
        document.dispatchEvent(new CustomEvent('item-operation-undone', {
          detail: { itemId: numericId, operationType: 'archive' },
        }));
      } catch (e) { console.error('dispatch restore failed', e); }
      toast({ title: t('ui.republished') });
      onDeleteSuccess?.();
    } catch (err: any) {
      console.error('Restore failed', err);
      toast({ title: t('ui.republish_failed'), description: err?.message, variant: 'destructive' });
    } finally {
      setIsRestoring(false);
    }
  };
  
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
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/auth', { state: { from: '/feed' } });
                  return;
                }
                useUserFilterProfileStore.getState().setProfile({
                  id: postedBy.id!,
                  name: postedBy.name,
                  avatar: postedBy.avatar,
                });
                navigate(`/feed?user=${postedBy.id}`);
                requestAnimationFrame(() => {
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                });
              }}
              className="flex items-center text-left"
            >
              <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                <AvatarImage src={postedBy.avatar} alt={postedBy.name} size={32} className="w-full h-full object-cover" />
              </div>
              <div className="text-sm font-medium">{postedBy.name}</div>
            </button>
          ) : (
            <div className="flex items-center">
              <div className="h-8 w-8 rounded-full overflow-hidden mr-2 flex-shrink-0">
                <AvatarImage src={postedBy.avatar} alt={postedBy.name} size={32} className="w-full h-full object-cover" />
              </div>
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
                {isArchived ? (
                  <>
                    <DropdownMenuItem
                      onClick={handleRestoreClick}
                      disabled={isRestoring}
                      className="text-primary"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      <span>{t('ui.republish')}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={handleLocalDeleteClick}
                      className="text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      <span>{t('ui.delete_archived_item')}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={handleLocalDeleteClick}
                    className="text-destructive"
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    <span>{t('ui.archive')}</span>
                  </DropdownMenuItem>
                )}
              </>
            ) : (
              <>
                {isAuthenticated && handleReport && (
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
