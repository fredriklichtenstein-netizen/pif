
import { MessageCircle } from "lucide-react";
import { useEffect } from "react";
import { useTranslation } from 'react-i18next';
import { LazyCommentsSection } from "@/components/comments/LazyCommentsSection";

interface CommentButtonProps {
  onCommentToggle: () => void;
  commentsCount?: number;
  itemId: string;
  showComments: boolean;
}

export function CommentButton({ 
  onCommentToggle, 
  commentsCount = 0,
  itemId,
  showComments
}: CommentButtonProps) {
  const { t } = useTranslation();
  
  const handleCommentClick = () => {
    onCommentToggle();
  };
  
  // Debug logging when component mounts or updates
  useEffect(() => {
  }, [itemId, showComments, commentsCount]);
  
  return (
    <>
      <button 
        onClick={handleCommentClick}
        className="flex items-center gap-2 rounded-md px-3 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors"
        aria-label={t('interactions.comment')}
        data-testid="comment-button"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="text-sm font-medium">
          {commentsCount > 0 ? `${t('interactions.comment')} (${commentsCount})` : t('interactions.comment')}
        </span>
      </button>
      
      {/* We render the LazyCommentsSection only when showComments is true */}
      {showComments && (
        <div className="mt-4" data-testid="comments-section-container">
          <LazyCommentsSection 
            itemId={itemId}
            isVisible={showComments}
            onClose={onCommentToggle}
          />
        </div>
      )}
    </>
  );
}
