
import { useEffect } from "react";
import { useItemCardWrapper } from "./hooks/useItemCardWrapper";
import { ItemCardWrapperContent } from "./ItemCardWrapperContent";
import { ItemCardDialogs } from "./ItemCardDialogs";
import { ItemCardError } from "./ItemCardError";
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
  const {
    isItemArchived,
    errors,
    showError,
    handleRetry,
    handleDismissError,
    parsedCoordinates,
    isOwner,
    showDeleteDialog,
    handleDeleteClick,
    setShowDeleteDialog,
    handleEdit,
    handleMessage,
    checkInterestedUsers,
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
    cleanupRealtime,
    handleRefresh,
    isItemDeleted,
    handleDeleteSuccess,
    handleReportClick
  } = useItemCardWrapper({
    id,
    postedBy,
    archived_at,
    archived_reason,
    onOperationSuccess,
    coordinates
  });

  // Cleanup effect to ensure realtime connections are removed
  useEffect(() => {
    return () => {
      console.log(`ItemCardWrapper unmounting, cleaning up resources for item ${id}`);
      cleanupRealtime();
    };
  }, [id, cleanupRealtime]);

  // If the item was deleted, don't render it anymore
  if (isItemDeleted) {
    return null;
  }

  // If there are errors, show a simplified error card
  if (showError && errors.length > 0) {
    return (
      <ItemCardError
        showError={showError}
        errors={errors}
        onRetry={handleRetry}
        onDismiss={handleDismissError}
      />
    );
  }
  
  const handleCloseDeleteDialog = () => {
    console.log("Closing delete dialog...");
    setShowDeleteDialog(false);
  };
  
  return (
    <>
      <ItemCardWrapperContent
        id={id}
        title={title}
        description={description}
        image={image}
        images={images}
        location={location}
        category={category}
        condition={condition}
        measurements={measurements}
        postedBy={postedBy}
        isOwner={isOwner}
        isItemArchived={isItemArchived}
        archived_reason={archived_reason}
        realtimeError={realtimeError}
        handleRefresh={handleRefresh}
        parsedCoordinates={parsedCoordinates}
        handleReportClick={handleReportClick}
        handleEdit={handleEdit}
        handleDeleteClick={handleDeleteClick}
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
        handleLike={handleLike}
        handleCommentToggle={handleCommentToggle}
        handleShowInterest={handleShowInterest}
        handleBookmark={handleBookmark}
        handleMessage={handleMessage}
        handleShare={handleShare}
        handleReport={handleReport}
        getInterestedUsers={getInterestedUsers}
        setComments={setComments}
        isRealtimeSubscribed={isRealtimeSubscribed}
      />

      <ItemCardDialogs
        id={id}
        showDeleteDialog={showDeleteDialog}
        onCloseDeleteDialog={handleCloseDeleteDialog}
        checkInterestedUsers={checkInterestedUsers}
        onDeleteSuccess={handleDeleteSuccess}
      />
    </>
  );
}
