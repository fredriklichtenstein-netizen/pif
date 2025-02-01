import { ThumbsUp, Reply, Trash2 } from "lucide-react";
import type { Comment } from "@/types/comment";

interface CommentCardProps {
  comment: Comment;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onReply?: (commentId: string) => void;
  currentUser?: string;
}

export function CommentCard({
  comment,
  onLike,
  onDelete,
  onReply,
  currentUser = "Current User",
}: CommentCardProps) {
  return (
    <div className="bg-gray-50 p-3 rounded-lg">
      <div className="flex items-start gap-2">
        <img
          src={comment.author.avatar}
          alt={comment.author.name}
          className="w-8 h-8 rounded-full"
        />
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium">{comment.author.name}</span>
              <span className="text-sm text-gray-500">
                {new Date(comment.createdAt).toLocaleDateString()}
              </span>
            </div>
            {comment.author.name === currentUser && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-gray-400 hover:text-red-500"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
          <p className="text-sm mt-1">{comment.text}</p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => onLike(comment.id)}
              className={`text-sm flex items-center gap-1 ${
                comment.isLiked ? "text-primary" : "text-gray-500"
              }`}
            >
              <ThumbsUp size={14} />
              {comment.likes > 0 && <span>{comment.likes}</span>}
            </button>
            {onReply && (
              <button 
                onClick={() => onReply(comment.id)}
                className="text-sm flex items-center gap-1 text-gray-500"
              >
                <Reply size={14} />
                Reply
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}