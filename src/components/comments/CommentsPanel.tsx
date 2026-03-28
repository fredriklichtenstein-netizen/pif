
import { useEffect } from "react";
import { CommentInput } from "./CommentInput";
import { CommentList } from "./CommentList";
import { LoadingComments } from "./LoadingComments";
import { CommentsError } from "./CommentsError";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { Comment } from "@/types/comment";

interface CommentsPanelProps {
  user?: {
    id?: string;
    name?: string;
    avatar?: string;
  };
  isLoading: boolean;
  error: Error | null;
  comments: Comment[];
  useFallbackMode: boolean;
  isInitialized: boolean;
  currentUser: {
    id?: string;
    name?: string;
    avatar?: string;
  } | undefined;
  onAddComment: (text: string) => void;
  onLike: (commentId: string) => void;
  onDelete: (commentId: string) => void;
  onEdit: (commentId: string, text: string) => void;
  onReply: (commentId: string, text: string) => void;
  onReport: (commentId: string) => void;
  refreshComments: () => void;
}

export function CommentsPanel({
  user,
  isLoading,
  error,
  comments,
  useFallbackMode,
  isInitialized,
  currentUser,
  onAddComment,
  onLike,
  onDelete,
  onEdit,
  onReply,
  onReport,
  refreshComments,
}: CommentsPanelProps) {
  const isReallyLoading = isLoading && !isInitialized;
  const { t } = useTranslation();
  
  useEffect(() => {
    console.log("CommentsPanel rendering with comments:", comments);
    if (currentUser) {
      console.log("Current user:", currentUser);
    }
  }, [comments, currentUser]);
  
  const renderCommentInput = () => (
    <CommentInput 
      onSubmit={onAddComment} 
      placeholder={t('interactions.write_comment')}
      disabled={!user} 
    />
  );

  const renderContent = () => {
    if (isReallyLoading && !comments.length) {
      return <div className="mt-4"><LoadingComments /></div>;
    }
    
    if (error && !comments.length && !useFallbackMode) {
      return (
        <div className="py-6 space-y-4">
          <CommentsError 
            error={error} 
            onRetry={refreshComments} 
          />
          <div className="text-center">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshComments}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              {t('interactions.try_again')}
            </Button>
          </div>
        </div>
      );
    }

    if (useFallbackMode && comments.length > 0) {
      return (
        <div className="mt-4">
          <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-800 rounded-md flex items-center text-sm border border-blue-200">
            <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>{t('interactions.fallback_comments_notice')}</span>
          </div>
          <CommentList
            comments={comments}
            isLoading={isLoading}
            currentUserId={currentUser?.id}
            onLike={onLike}
            onDelete={onDelete}
            onEdit={onEdit}
            onReply={onReply}
            onReport={onReport}
          />
        </div>
      );
    }

    if (comments.length > 0) {
      return (
        <div className="mt-4">
          <CommentList
            comments={comments}
            isLoading={isLoading}
            currentUserId={currentUser?.id}
            onLike={onLike}
            onDelete={onDelete}
            onEdit={onEdit}
            onReply={onReply}
            onReport={onReport}
          />
        </div>
      );
    }

    return (
      <div className="py-6 text-center text-muted-foreground">
        <p>{t('interactions.no_comments_yet')}</p>
      </div>
    );
  };

  return (
    <>
      {renderCommentInput()}
      {renderContent()}
    </>
  );
}
