
import { useState, useEffect } from "react";
import { Comment } from "@/types/comment";
import { useCommentCreate } from "./useCommentCreate";
import { useCommentDelete } from "./useCommentDelete";
import { useCommentEdit } from "./useCommentEdit";
import { useCommentInteractions } from "./useCommentInteractions";
import { useCommentRefresh } from "./useCommentRefresh";

export const useCommentActions = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  }
) => {
  const [isLoading, setIsLoading] = useState(false);

  // Import individual comment action hooks
  const { handleAddComment } = useCommentCreate(itemId, comments, setComments, currentUser);
  const { handleDeleteComment } = useCommentDelete(comments, setComments);
  const { handleEditComment } = useCommentEdit(comments, setComments);
  const { handleLikeComment, handleReplyToComment, handleReportComment } = useCommentInteractions(comments, setComments, currentUser);
  const { refreshComments, isRefreshing } = useCommentRefresh(itemId, setComments, currentUser);

  // Update the loading state based on the refreshing state
  useEffect(() => {
    setIsLoading(isRefreshing);
  }, [isRefreshing]);

  return {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment,
    refreshComments,
    isLoading
  };
};
