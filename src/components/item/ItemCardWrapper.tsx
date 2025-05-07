
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { ItemCardHeader } from "./ItemCardHeader";
import { ItemCardGallery } from "./ItemCardGallery";
import { ItemCardContent } from "./content/ItemCardContent";
import { ItemCardActions } from "./ItemCardActions";
import { NetworkStatus } from "../common/NetworkStatus";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import { ItemErrorDisplay } from "./content/ItemErrorDisplay";
import { useItemErrorHandler } from "./content/useItemErrorHandler";
import { useCoordinatesParser } from "./content/useCoordinatesParser";
import { ItemDeleteDialog } from "./ItemDeleteDialog";
import type { ItemCardProps } from "./types";

export const ItemCardWrapper = function ItemCardWrapper({
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
  postedBy
}: ItemCardProps) {
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
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

  // Log all props for debugging
  useEffect(() => {
    console.log('ItemCardWrapper props:', {
      id, title, description, image, images, location, 
      coordinates, category, condition, measurements, postedBy
    });
  }, [id, title, description, image, images, location, coordinates, category, condition, measurements, postedBy]);
  
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

  // If there are errors, show a simplified error card
  if (showError && errors.length > 0) {
    return <ItemErrorDisplay 
      errors={errors} 
      onRetry={handleRetry}
      onDismiss={handleDismissError}
    />;
  }
  
  const numericItemId = typeof id === 'string' ? parseInt(id, 10) : id;
  
  return (
    <Card id={`item-card-${id}`} className="overflow-hidden transition-shadow hover:shadow-md rounded-xl">
      {realtimeError && (
        <div className="p-2 bg-gray-50 py-0">
          <NetworkStatus onRetry={refreshItemData} />
        </div>
      )}
      
      <ItemCardHeader 
        postedBy={postedBy} 
        isOwner={isOwner} 
        handleReport={handleReportClick} 
        coordinates={parsedCoordinates} 
        itemId={numericItemId}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />
      
      <ItemCardGallery 
        images={images.length > 0 ? images : image ? [image] : []} 
        title={title} 
        category={category} 
      />
      
      {/* Actions section */}
      <div className="pt-2 pb-0 px-0">
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
      </div>
      
      {/* Content section */}
      <div className="p-4 pt-2 py-0">
        <ItemCardContent 
          description={description} 
          condition={condition} 
          measurements={measurements} 
        />
      </div>
      
      {/* Delete confirmation dialog */}
      <ItemDeleteDialog
        id={id}
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        checkInterestedUsers={checkInterestedUsers}
      />
    </Card>
  );
};
