
import { useState, useEffect, useCallback } from "react";
import { useItemCard } from "@/hooks/useItemCard";
import { useItemErrorHandler } from "../content/useItemErrorHandler";
import { useCoordinatesParser } from "../content/useCoordinatesParser";
import { useItemRefresh } from "../status/ItemRefresh";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { useItemCardActions } from "@/hooks/item/useItemCardActions";

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
  
  // Get delete and other action handlers
  const { 
    handleDeleteClick, 
    handleEdit, 
    checkInterestedUsers,
    handleMessage: handleMessageAction
  } = useItemCardActions(id, postedBy?.id);
  
  // Basic action handlers
  const handleEditLocal = useCallback(() => {
    if (handleEdit) {
      handleEdit();
    } else {
      window.location.href = `/post/edit/${id}`;
    }
  }, [id, handleEdit]);
  
  // Check interested users - now returns the count properly
  const checkInterestedUsersLocal = useCallback(async (): Promise<number> => {
    try {
      if (checkInterestedUsers) {
        return await checkInterestedUsers();
      }
      // Fallback to getting interested users through the item card
      const users = await getInterestedUsers();
      return Array.isArray(users) ? users.length : 0;
    } catch (error) {
      console.error("Error checking interested users:", error);
      return 0;
    }
  }, [checkInterestedUsers, getInterestedUsers]);
  
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

  // Wrap handleShowInterest to require confirmation when the user is
  // about to *withdraw* an existing interest. Adding interest stays one-tap.
  const [withdrawConfirmOpen, setWithdrawConfirmOpen] = useState(false);

  const handleShowInterestWithConfirm = useCallback(() => {
    if (showInterest) {
      setWithdrawConfirmOpen(true);
      return;
    }
    handleShowInterest();
  }, [showInterest, handleShowInterest]);

  const confirmWithdrawInterest = useCallback(() => {
    setWithdrawConfirmOpen(false);
    handleShowInterest();
  }, [handleShowInterest]);

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
    handleEdit: handleEditLocal,
    handleMessage: handleMessageAction || handleMessage,
    checkInterestedUsers: checkInterestedUsersLocal,
    handleDeleteClick,
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
    handleShowInterest: handleShowInterestWithConfirm,
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
    handleReportClick,
    withdrawConfirmOpen,
    setWithdrawConfirmOpen,
    confirmWithdrawInterest,
  };
}
