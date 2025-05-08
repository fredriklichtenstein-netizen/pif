
import type { User } from "@/hooks/item/useItemInteractions";

export const hasUserCommented = (commenters: User[], currentUserId: string): boolean => {
  if (!currentUserId || !commenters.length) return false;
  return commenters.some(commenter => commenter.id === currentUserId);
};
