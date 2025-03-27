
import { Comment } from "@/types/comment";

/**
 * Formats raw comment data from Supabase into the Comment type
 */
export const formatCommentFromDB = (
  comment: any,
  isCurrentUser: boolean = false
): Comment => {
  const profile = comment.profiles || {};
  const fullName = `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User';
  
  return {
    id: comment.id.toString(),
    text: comment.content,
    author: {
      id: comment.user_id,
      name: fullName,
      avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
    },
    isLiked: false,
    likes: 0,
    replies: [],
    createdAt: new Date(comment.created_at),
    isOwn: isCurrentUser
  };
};
