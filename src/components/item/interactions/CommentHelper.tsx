
import type { User } from "@/hooks/item/useItemInteractions";

export const hasUserCommented = (
  commenters: User[],
  currentUserId?: string
): boolean => {
  if (!currentUserId || !commenters?.length) {
    return false;
  }
  
  return commenters.some(comment => 
    (comment.author && comment.author.id === currentUserId) || 
    comment.replies?.some(reply => 
      reply.author && reply.author.id === currentUserId
    )
  );
};
