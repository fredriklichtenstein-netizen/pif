
import { useCommentAdd } from "./useCommentAdd";
import { useCommentRemove } from "./useCommentDelete";
import { Comment } from "@/types/comment";

export const useCommentMutations = (itemId: string) => {
  const { addComment } = useCommentAdd(itemId);
  const { deleteComment } = useCommentRemove();
  
  return {
    addComment,
    deleteComment
  };
};
