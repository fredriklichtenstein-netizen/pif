
import { useEffect } from "react";
import { useItemInteractions } from "./item/useItemInteractions";
import { useItemActions } from "./item/useItemActions";
import { useComments } from "./item/useComments";
import { useCommentData } from "./comments/useCommentData";
import { useItemUsers } from "./item/useItemUsers";

export const useItemCard = (id: string) => {
  // Core item interactions (likes, interests, bookmarks)
  const {
    isLiked,
    likesCount,
    showInterest,
    interestsCount,
    isBookmarked,
    handleShowInterest,
    handleLike,
    handleBookmark,
    fetchLikers,
  } = useItemInteractions(id);

  // Item actions (message, share, report)
  const {
    handleMessage,
    handleShare,
    handleReport,
  } = useItemActions();

  // Comments state and toggle
  const {
    showComments,
    comments: localComments,
    handleCommentToggle,
    setComments,
  } = useComments();

  // Fetch comments from database
  const { comments: fetchedComments, isLoading: commentsLoading } = useCommentData(id);
  
  // Update local comments when fetched comments change
  useEffect(() => {
    if (fetchedComments && fetchedComments.length > 0) {
      console.log(`Setting ${fetchedComments.length} comments in useItemCard for item ${id}`);
      setComments(fetchedComments);
    }
  }, [fetchedComments, setComments, id]);
  
  // Manage users who interacted with the item
  const { likers, commenters } = useItemUsers(localComments, fetchLikers, likesCount);

  return {
    // States
    isLiked,
    likesCount,
    showComments,
    comments: localComments,
    commentsCount: localComments.length,
    commentsLoading,
    showInterest,
    interestsCount,
    isBookmarked,
    likers,
    commenters,
    
    // Actions
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
