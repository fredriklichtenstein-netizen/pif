
import { useState, useEffect, useCallback } from "react";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./content/ItemCardContent";
import { ItemCardActions } from "./ItemCardActions";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import { useItemErrorHandler } from "./content/useItemErrorHandler";
import { useCoordinatesParser } from "./content/useCoordinatesParser";
import { ItemDeleteDialog } from "./ItemDeleteDialog";
import { ItemCardLayout } from "./layout/ItemCardLayout";
import { ItemArchivedBanner } from "./status/ItemArchivedBanner";
import { ItemErrorHandler } from "./status/ItemErrorHandler";
import type { ItemCardProps } from "./types";
import { useToast } from "@/hooks/use-toast";

export function ItemCardWrapper({
  id,
  title,
  description,
  image,
  images = [],
  location,
  coordinates,
  category,
  condition,
  measurements = {},
  postedBy,
  archived_at,
  archived_reason,
  onOperationSuccess
}: ItemCardProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isItemDeleted, setIsItemDeleted] = useState(false);
  const [isItemArchived, setIsItemArchived] = useState(!!archived_at);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { errors, showError, handleRetry, handleDismissError } = useItemErrorHandler();
  const { parsedCoordinates } = useCoordinatesParser(coordinates);
  const { toast } = useToast();

  // Update archived status when props change
  useEffect(() => {
    setIsItemArchived(!!archived_at);
  }, [archived_at]);

  // Get card actions and interactions
  const {
    isOwner,
    showDeleteDialog,
    handleDeleteClick,
    setShowDeleteDialog,
    handleEdit,
    handleMessage,
    checkInterestedUsers
  } = useItemCardActions(id, postedBy.id);
  
  const {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    commentsError,
    interactionsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    isLoadingInterested,
    interestedError,
    handleLike,
    handleCommentToggle,
    handleShowInterest,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData
  } = useItemCard(String(id));
  
  const handleReportClick = () => {
    setIsReportDialogOpen(true);
  };

  // Handle successful delete or archive with better error recovery
  const handleDeleteSuccess = useCallback(() => {
    console.log("Item was successfully deleted or archived");
    
    try {
      setIsItemDeleted(true);
      
      // Call the parent's success callback after a short delay to allow state updates
      if (onOperationSuccess) {
        // Use setTimeout to ensure UI updates first
        setTimeout(() => {
          try {
            onOperationSuccess();
          } catch (error) {
            console.error("Error in onOperationSuccess callback:", error);
            toast({
              title: "Update Error",
              description: "Something went wrong while refreshing the page. Please refresh manually.",
              variant: "destructive",
            });
            // Force refresh the data if callback fails
            refreshItemData();
          }
        }, 300);
      }
    } catch (error) {
      console.error("Error handling delete success:", error);
      // Even if there's an error, try to refresh data
      setTimeout(() => refreshItemData(), 500);
    }
  }, [onOperationSuccess, refreshItemData, toast]);

  // Fully refresh the component if needed
  const forceRefresh = useCallback(() => {
    setIsRefreshing(true);
    setTimeout(() => {
      refreshItemData();
      setIsRefreshing(false);
    }, 100);
  }, [refreshItemData]);

  // If the item was deleted, don't render it anymore
  if (isItemDeleted) {
    return null;
  }

  // If there are errors, show a simplified error card
  if (showError && errors.length > 0) {
    return <ItemErrorHandler 
      showError={showError}
      errors={errors}
      onRetry={handleRetry}
      onDismiss={handleDismissError}
    />;
  }
  
  const numericItemId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  if (isRefreshing) {
    return <div className="p-4 text-center">Refreshing...</div>;
  }
  
  return (
    <ItemCardLayout
      id={id}
      isRealtimeError={!!realtimeError}
      refreshItemData={() => {
        try {
          refreshItemData();
        } catch (error) {
          console.error("Error refreshing item data:", error);
          forceRefresh();
        }
      }}
      statusBanner={isItemArchived ? <ItemArchivedBanner reason={archived_reason} /> : undefined}
      header={
        <ItemCardHeader 
          postedBy={postedBy} 
          isOwner={isOwner} 
          handleReport={handleReportClick} 
          coordinates={parsedCoordinates} 
          itemId={numericItemId}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
        />
      }
      gallery={
        <ItemCardGallery 
          images={images.length > 0 ? images : image ? [image] : []} 
          title={title} 
          category={category} 
        />
      }
      actions={
        <ItemCardActions 
          id={id} 
          postedBy={postedBy} 
          isOwner={isOwner} 
          isLiked={isLiked} 
          showComments={showComments} 
          isBookmarked={isBookmarked} 
          showInterest={showInterest} 
          commentsCount={commentsCount} 
          likesCount={likesCount} 
          interestsCount={interestsCount} 
          likers={likers} 
          interestedUsers={interestedUsers} 
          commenters={commenters} 
          comments={comments} 
          commentsLoading={commentsLoading} 
          commentsError={commentsError} 
          interactionsLoading={interactionsLoading} 
          isLoadingInterested={isLoadingInterested} 
          interestedError={interestedError} 
          onLikeToggle={handleLike} 
          onCommentToggle={handleCommentToggle} 
          onShowInterest={handleShowInterest} 
          onBookmarkToggle={handleBookmark} 
          onMessage={handleMessage} 
          onShare={handleShare} 
          onReport={handleReport} 
          onEdit={handleEdit} 
          onDelete={handleDeleteClick} 
          getInterestedUsers={getInterestedUsers} 
          setComments={setComments} 
          isRealtimeSubscribed={isRealtimeSubscribed} 
        />
      }
      content={
        <ItemCardContent 
          description={description} 
          condition={condition} 
          measurements={measurements} 
        />
      }
      dialogs={
        <ItemDeleteDialog
          id={id}
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          checkInterestedUsers={checkInterestedUsers}
          onSuccess={handleDeleteSuccess}
        />
      }
    />
  );
}
