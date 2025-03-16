
import { useState } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useComments } from "./item/useComments";

export const useItemCard = (id: string) => {
  const {
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleBookmark,
  } = useItemInteractions(id);

  const {
    handleMessage,
    handleShare,
    handleReport,
  } = useItemActions();

  const {
    showComments,
    comments,
    handleCommentToggle,
    setComments,
  } = useComments();

  return {
    isLiked,
    likesCount,
    showComments,
    comments,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleCommentToggle,
    handleMessage,
    handleShare,
    handleReport,
    handleBookmark,
    setComments,
  };
};
