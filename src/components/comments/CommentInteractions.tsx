
import { ThumbsUp, Reply } from "lucide-react";
import { useTranslation } from 'react-i18next';

interface CommentInteractionsProps {
  likes: number;
  isLiked: boolean;
  onLike: () => void;
  onReply: () => void;
  /** Closed post: show the like count only, no like/reply buttons. */
  readOnly?: boolean;
}

export function CommentInteractions({
  likes,
  isLiked,
  onLike,
  onReply,
  readOnly = false,
}: CommentInteractionsProps) {
  const { t } = useTranslation();

  if (readOnly) {
    return likes > 0 ? (
      <div className="flex items-center gap-1 mt-2 text-sm text-gray-500">
        <ThumbsUp size={14} />
        <span>{likes}</span>
      </div>
    ) : null;
  }

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
      <button
        onClick={onReply}
        className="text-sm flex items-center gap-1 text-gray-500"
      >
        <Reply size={14} />
        {t('comments.reply')}
      </button>
    </div>
  );
}
