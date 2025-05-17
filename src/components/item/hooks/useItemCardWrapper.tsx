
import { useState, useEffect, useCallback } from "react";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemErrorHandler } from "../content/useItemErrorHandler";
import { useCoordinatesParser } from "../content/useCoordinatesParser";
import { useItemRefresh } from "../status/ItemRefresh";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

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
  const [isItemDeleted, setIsItemDeleted] = useState(false);
  const { errors, showError, handleRetry, handleDismissError } = useItemErrorHandler();
  const { parsedCoordinates } = useCoordinatesParser(coordinates);
  const { session } = useGlobalAuth();
  
  // Check if current user is the owner
  const isOwner = session?.user?.id === postedBy?.id;

  // Update archived status when props change
  useEffect(() => {
    setIsItemArchived(!!archived_at);
  }, [archived_at]);

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
    handleMessage,
    setComments,
    getInterestedUsers,
    isRealtimeSubscribed,
    realtimeError,
    refreshItemData,
    cleanup: cleanupRealtime
  } = useItemCard(String(id));

  // Refresh handling
  const { isRefreshing, handleRefresh } = useItemRefresh({ refreshItemData });
  
  // Basic action handlers
  const handleEdit = useCallback(() => {
    window.location.href = `/post/edit/${id}`;
  }, [id]);
  
  // Check interested users - now simplified to just count
  const checkInterestedUsers = useCallback(async (): Promise<number> => {
    try {
      return await getInterestedUsers();
    } catch (error) {
      console.error("Error checking interested users:", error);
      return 0;
    }
  }, [getInterestedUsers]);
  
  // Handle operation success
  const handleOperationSuccess = useCallback(() => {
    if (onOperationSuccess) {
      onOperationSuccess();
    }
    setIsItemDeleted(true);
  }, [onOperationSuccess]);
  
  // Report dialog handling
  const handleReportClick = useCallback(() => {
    setIsReportDialogOpen(true);
  }, []);

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
    handleOperationSuccess,
    handleReportClick
  };
}
