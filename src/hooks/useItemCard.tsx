import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useComments } from "./item/useComments";

export const useItemCard = (id: string) => {
  const {
    isLiked,
    showInterest,
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
    showComments,
    comments,
    showInterest,
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