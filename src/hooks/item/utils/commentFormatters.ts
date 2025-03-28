
import { Comment } from "@/types/comment";

interface RawComment {
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

export const formatCommentFromDB = (data: RawComment, isOwn = false): Comment => {
  const profile = data.profiles || {};
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'User';
  
  return {
    id: data.id.toString(),
    text: data.content,
    author: {
      id: data.user_id,
      name: fullName,
      avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
    },
    likes: 0, // We'll implement comment likes later
    isLiked: false,
    replies: [], // We'll implement replies later
    createdAt: new Date(data.created_at),
    isOwn
  };
};
