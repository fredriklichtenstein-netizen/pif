
import { useState, useEffect, useCallback } from "react";
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
  const [interactionEnabled, setInteractionEnabled] = useState(true);
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
  } = useItemCardActions(id, postedBy?.id);
  
  // Get item interactions
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

  // Delete handling with enhanced cleanup
  const { isItemDeleted, handleDeleteSuccess } = useItemDelete(
    id, 
    cleanupRealtime, 
    onOperationSuccess
  );
  
  // Report dialog handling with interaction management
  const handleReportClick = useCallback(() => {
    if (!interactionEnabled) return;
    setIsReportDialogOpen(true);
  }, [interactionEnabled]);

  // Manage interactive state
  useEffect(() => {
    if (showDeleteDialog) {
      setInteractionEnabled(false);
    } else {
      // Re-enable interactions after a small delay
      const timer = setTimeout(() => {
        setInteractionEnabled(true);
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [showDeleteDialog]);

  // Clean up resources when component unmounts or item is deleted
  useEffect(() => {
    return () => {
      try {
        console.log(`ItemCardWrapper hook cleanup for item ${id}`);
        cleanupRealtime();
      } catch (error) {
        console.error("Error during hook cleanup:", error);
      }
    };
  }, [id, cleanupRealtime]);

  // Force cleanup when component is unmounted due to deletion
  useEffect(() => {
    if (isItemDeleted) {
      cleanupRealtime();
    }
  }, [isItemDeleted, cleanupRealtime]);

  // Wrap interaction handlers to prevent actions when interactions are disabled
  const wrapInteraction = useCallback((handler) => {
    return (...args) => {
      if (interactionEnabled) {
        return handler(...args);
      }
    };
  }, [interactionEnabled]);

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
    handleDeleteClick: wrapInteraction(handleDeleteClick),
    setShowDeleteDialog,
    handleEdit: wrapInteraction(handleEdit),
    handleMessage: wrapInteraction(handleMessage),
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
    handleLike: wrapInteraction(handleLike),
    handleCommentToggle: wrapInteraction(handleCommentToggle),
    handleShowInterest: wrapInteraction(handleShowInterest),
    handleShare: wrapInteraction(handleShare),
    handleReport: wrapInteraction(handleReport),
    handleBookmark: wrapInteraction(handleBookmark),
    setComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData,
    cleanupRealtime,
    isRefreshing,
    handleRefresh: wrapInteraction(handleRefresh),
    isItemDeleted,
    handleDeleteSuccess,
    handleReportClick
  };
}
