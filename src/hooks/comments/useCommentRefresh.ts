
import { useCommentsCore } from "./useCommentsCore";
import type { Comment } from "@/types/comment";

export const useCommentRefresh = (
  itemId: string,
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  }
) => {
  return useCommentsCore(itemId, setComments, currentUser);
};
