
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { useItemCard } from "@/hooks/useItemCard";
import { getDeleteDialogManager } from "@/hooks/item/useItemDeleteDialog";

interface UseItemCardContainerProps {
  id: number;
  postedBy: {
    id: string;
    name: string;
    avatar?: string; // Make avatar optional to match our updated types
  };
}

export const useItemCardContainer = ({ id, postedBy }: UseItemCardContainerProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Get user interactions data from the hook
  const itemCardData = useItemCard(id.toString());
  
  // Extract only what we need from itemCardData
  const {
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage: itemCardHandleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  } = itemCardData;

  // Create a wrapper function that adapts the signature
  const handleMessage = (e: React.MouseEvent) => {
    if (postedBy.id) {
      itemCardHandleMessage(e, id.toString(), postedBy.id);
    }
  };

  const handleDelete = () => {
    // Open the global archive/delete dialog so the user can choose to archive
    // (soft delete) or permanently delete — same flow as the feed cards.
    const dialogManager = getDeleteDialogManager();

    if (dialogManager) {
      dialogManager.openDeleteDialog({
        id,
        onSuccess: () => {
          setIsDeleting(false);
        },
      });
      return;
    }

    // Fallback: dispatch the global event listened to by GlobalDeleteDialog.
    document.dispatchEvent(
      new CustomEvent("global-delete-dialog-open", {
        detail: {
          itemId: id,
          onSuccess: () => setIsDeleting(false),
        },
        bubbles: true,
        cancelable: true,
      })
    );
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  return {
    // State
    isDeleting,
    isLiked,
    likesCount,
    showComments,
    comments,
    commentsCount,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    interestedUsers,
    setComments,
    // Actions
    handleDelete,
    handleEdit,
    handleMessage,
    handleLike,
    handleCommentToggle,
    handleBookmark,
    handleShowInterest,
    handleShare,
    handleReport,
  };
};

