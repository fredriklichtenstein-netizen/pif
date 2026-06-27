
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useItemCard } from "@/hooks/useItemCard";
import { useWithdrawInterestConfirm } from "@/hooks/item/useWithdrawInterestConfirm";
import type { ItemType } from "@/components/item/types";

interface UseItemCardContainerProps {
  id: number;
  postedBy: {
    id: string;
    name: string;
    avatar?: string;
  };
  item_type?: ItemType;
}

export const useItemCardContainer = ({ id, postedBy, item_type }: UseItemCardContainerProps) => {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  // Get user interactions data from the hook
  const itemCardData = useItemCard(id.toString());

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

  const handleMessage = (e: React.MouseEvent) => {
    if (postedBy.id) {
      itemCardHandleMessage(e, id.toString(), postedBy.id);
    }
  };

  // Open the local SimpleDeleteDialog (same pattern as feed cards via
  // ItemCardHeader). The previous global-dialog/CustomEvent route was a
  // silent no-op outside the feed tree.
  const handleDelete = () => {
    setIsDeleting(true);
    setDeleteDialogOpen(true);
  };

  const handleEdit = () => {
    navigate(`/post/edit/${id}`);
  };

  const {
    withdrawConfirmOpen,
    setWithdrawConfirmOpen,
    handleShowInterestWithConfirm,
    confirmWithdrawInterest,
    withdrawCopy,
  } = useWithdrawInterestConfirm({
    showInterest,
    handleShowInterest: handleShowInterest as (n?: string) => void,
    itemType: item_type,
  });

  return {
    // State
    isDeleting,
    setIsDeleting,
    deleteDialogOpen,
    setDeleteDialogOpen,
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
    handleShowInterest: handleShowInterestWithConfirm,
    handleShare,
    handleReport,
    // Withdraw confirm
    withdrawConfirmOpen,
    setWithdrawConfirmOpen,
    confirmWithdrawInterest,
    withdrawCopy,
  };
};
