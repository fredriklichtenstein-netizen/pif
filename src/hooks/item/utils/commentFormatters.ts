
import { Comment } from "@/types/comment";
import { extractUserFromProfile } from "./userUtils";

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
  const profile = dbComment.profiles || {};
  // Use consistent public display
  const user = extractUserFromProfile(profile, dbComment.user_id);

  return {
    id: dbComment.id.toString(),
    text: dbComment.content,
    author: {
      id: dbComment.user_id,
      name: user.name,
      avatar: user.avatar
    },
    likes: 0,
    isLiked: false,
    replies: [],
    createdAt: new Date(dbComment.created_at),
    isOwn: isOwnComment
  };
};
