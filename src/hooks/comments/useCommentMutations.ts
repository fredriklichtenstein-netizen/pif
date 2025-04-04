
import { useCommentAdd } from "./useCommentAdd";
import { useCommentDelete } from "./useCommentDelete";
import { Comment } from "@/types/comment";

export const useCommentMutations = (itemId: string) => {
  const { addComment } = useCommentAdd(itemId);
  const { deleteComment } = useCommentDelete();
  
  return {
    addComment,
    deleteComment
  };
};
