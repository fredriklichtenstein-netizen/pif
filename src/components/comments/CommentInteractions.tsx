
import { ThumbsUp, Reply } from "lucide-react";

interface CommentInteractionsProps {
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  onReply: () => void;
  maxReplyLevel: number;
  level: number;
}

export function CommentInteractions({
  likes,
  isLiked,
  onLike,
  onReply,
  maxReplyLevel,
  level
}: CommentInteractionsProps) {
  return (
    <div className="flex items-center gap-4 mt-2">
      <button
        onClick={onLike}
        className={`text-sm flex items-center gap-1 ${
          isLiked ? "text-primary" : "text-gray-500"
        }`}
      >
        <ThumbsUp size={14} />
        {likes > 0 && <span>{likes}</span>}
      </button>
      {level < maxReplyLevel && (
        <button
          onClick={onReply}
          className="text-sm flex items-center gap-1 text-gray-500"
        >
          <Reply size={14} />
          Reply
        </button>
      )}
    </div>
  );
}
