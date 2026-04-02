
import { useEffect } from "react";
import { useItemCardWrapper } from "./hooks/useItemCardWrapper";
import { ItemCardWrapperContent } from "./ItemCardWrapperContent";
import { ItemCardError } from "./ItemCardError";
import type { ItemCardProps } from "./types";
import type { OperationType } from "@/hooks/feed/useOptimisticFeedUpdates";

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
  item_type,
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
    handleDeleteClick,
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
  
  return (
    <ItemCardWrapperContent
      id={id}
      title={title}
      description={description}
      image={image}
      images={images}
      location={location}
      category={category}
      condition={condition}
      item_type={item_type}
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
  );
}
