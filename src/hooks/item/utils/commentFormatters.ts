
import { Comment } from "@/types/comment";

interface DBComment {
  id: number;
  content: string;
  created_at: string;
  user_id: string;
  profiles?: {
    id?: string;
    first_name?: string;
    last_name?: string;
    avatar_url?: string;
  };
}

export const formatCommentFromDB = (dbComment: DBComment, isOwnComment: boolean): Comment => {
  // Get the profile object or default to empty object
  const profile = dbComment.profiles || {};
  
  // Create a name from the profile fields
  const fullName = [profile.first_name, profile.last_name]
    .filter(Boolean)
    .join(' ') || 'Anonymous';
  
  // Generate avatar URL if not provided
  const avatarUrl = profile.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`;
  
  return {
    id: dbComment.id.toString(),
    text: dbComment.content,
    author: {
      id: dbComment.user_id,
      name: fullName,
      avatar: avatarUrl
    },
    likes: 0, // We'll implement this in a future update
    isLiked: false,
    replies: [],
    createdAt: new Date(dbComment.created_at),
    isOwn: isOwnComment
  };
};
