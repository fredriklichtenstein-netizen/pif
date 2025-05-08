
import { useState } from "react";
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
  onOperationSuccess
}: ItemCardProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isItemDeleted, setIsItemDeleted] = useState(false);
  const [isItemArchived, setIsItemArchived] = useState(!!archived_at);
  const { errors, showError, handleRetry, handleDismissError } = useItemErrorHandler();
  const { parsedCoordinates } = useCoordinatesParser(coordinates);

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

  // Handle successful delete or archive
  const handleDeleteSuccess = () => {
    console.log("Item was successfully deleted or archived");
    setIsItemDeleted(true);
    
    // Call the parent's success callback after a short delay to allow state updates
    if (onOperationSuccess) {
      setTimeout(() => {
        onOperationSuccess();
      }, 300);
    }
  };

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
  
  return (
    <ItemCardLayout
      id={id}
      isRealtimeError={!!realtimeError}
      refreshItemData={refreshItemData}
      statusBanner={isItemArchived ? <ItemArchivedBanner /> : undefined}
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
