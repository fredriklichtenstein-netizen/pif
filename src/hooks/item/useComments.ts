
import { useCommentsFetch } from "./useCommentsFetch";
import { useCommentsMutations } from "./useCommentsMutations";
import type { User } from "./utils/userUtils";
import type { Comment } from "@/types/comment";

export const useComments = (itemId: string) => {
  const { fetchComments, fetchCommentsCount, fetchCommenters } = useCommentsFetch(itemId);
  const { addComment, deleteComment } = useCommentsMutations(itemId);
  
  return {
    fetchComments,
    addComment,
    deleteComment,
    fetchCommentsCount,
    fetchCommenters
  };
};

// Re-export the types that consumers of this hook might need
export type { User, Comment };
