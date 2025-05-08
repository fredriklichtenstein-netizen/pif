
import { useState, useEffect } from "react";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./content/ItemCardContent";
import { ItemCardActions } from "./ItemCardActions";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import { useItemErrorHandler } from "./content/useItemErrorHandler";
import { useCoordinatesParser } from "./content/useCoordinatesParser";
import { ItemCardLayout } from "./layout/ItemCardLayout";
import { ItemArchivedBanner } from "./status/ItemArchivedBanner";
import { ItemErrorState } from "./status/ItemErrorState";
import { useItemRefresh } from "./status/ItemRefresh";
import { useItemDelete } from "@/hooks/item/useItemDelete";
import { ItemDialogs } from "./dialogs/ItemDialogs";
import type { ItemCardProps } from "./types";

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
  const [isItemArchived, setIsItemArchived] = useState(!!archived_at);
  const { errors, showError, handleRetry, handleDismissError } = useItemErrorHandler();
  const { parsedCoordinates } = useCoordinatesParser(coordinates);

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
    refreshItemData,
    cleanup: cleanupRealtime
  } = useItemCard(String(id));

  // Refresh handling
  const { isRefreshing, handleRefresh } = useItemRefresh({ refreshItemData });

  // Delete handling
  const { isItemDeleted, handleDeleteSuccess } = useItemDelete(id, cleanupRealtime, onOperationSuccess);
  
  // Report dialog handling
  const handleReportClick = () => {
    setIsReportDialogOpen(true);
  };

  // Clean up resources when component unmounts or item is deleted
  useEffect(() => {
    return () => {
      try {
        console.log(`ItemCard unmounting or being deleted, cleaning up resources for item ${id}`);
        cleanupRealtime();
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, [id, cleanupRealtime]);

  // If the item was deleted, don't render it anymore
  if (isItemDeleted) {
    return null;
  }

  // If there are errors, show a simplified error card
  if (showError && errors.length > 0) {
    return <ItemErrorState 
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
      refreshItemData={handleRefresh}
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
        <ItemDialogs
          id={id}
          showDeleteDialog={showDeleteDialog}
          onCloseDeleteDialog={() => setShowDeleteDialog(false)}
          checkInterestedUsers={checkInterestedUsers}
          onDeleteSuccess={handleDeleteSuccess}
        />
      }
    />
  );
}
