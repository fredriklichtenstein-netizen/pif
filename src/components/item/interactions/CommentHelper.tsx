
import type { User } from "@/hooks/item/useItemInteractions";

// Define a type for comments that includes the expected structure
interface Comment {
  author?: {
    id: string;
  };
  replies?: Array<{
    author?: {
      id: string;
    }
  }>;
}

export const hasUserCommented = (
  commenters: Comment[],
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
