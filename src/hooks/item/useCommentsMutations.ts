
import { Comment } from "@/types/comment";
import { useCommentMutations } from "../comments/useCommentMutations";

export const useCommentsMutations = (itemId: string) => {
  // Use the refactored hooks to maintain backward compatibility
  return useCommentMutations(itemId);
};
