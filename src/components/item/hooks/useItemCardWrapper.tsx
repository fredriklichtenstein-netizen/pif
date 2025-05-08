
import { useState, useEffect } from "react";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";
import { useItemErrorHandler } from "../content/useItemErrorHandler";
import { useCoordinatesParser } from "../content/useCoordinatesParser";
import { useItemRefresh } from "../status/ItemRefresh";
import { useItemDelete } from "@/hooks/item/useItemDelete";

export function useItemCardWrapper({
  id,
  postedBy,
  archived_at,
  archived_reason,
  onOperationSuccess,
  coordinates
}) {
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

  return {
    isReportDialogOpen,
    setIsReportDialogOpen,
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
    refreshItemData,
    cleanupRealtime,
    isRefreshing,
    handleRefresh,
    isItemDeleted,
    handleDeleteSuccess,
    handleReportClick
  };
}
