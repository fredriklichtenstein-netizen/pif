
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
  
  // Create a name from the profile fields with the new format
  const firstName = profile.first_name || '';
  const lastName = profile.last_name || '';
  
  // Format as "First name + first letter of last name"
  let fullName = firstName;
  if (lastName) {
    fullName = `${firstName} ${lastName.charAt(0)}`;
  }
  
  // Use fallback if no name is available
  const displayName = fullName || 'Anonymous';
  
  // Generate avatar URL if not provided
  const avatarUrl = profile.avatar_url || 
    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`;
  
  console.log("Formatting comment from DB:", {
    id: dbComment.id,
    content: dbComment.content,
    author: {
      id: dbComment.user_id,
      name: displayName,
      avatar: avatarUrl
    },
    isOwn: isOwnComment
  });
  
  return {
    id: dbComment.id.toString(),
    text: dbComment.content,
    author: {
      id: dbComment.user_id,
      name: displayName,
      avatar: avatarUrl
    },
    likes: 0, // We'll implement this in a future update
    isLiked: false,
    replies: [],
    createdAt: new Date(dbComment.created_at),
    isOwn: isOwnComment
  };
};
