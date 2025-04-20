
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { LoadingComments } from "../comments/LoadingComments";
import { CommentsError } from "../comments/CommentsError";
import { CommentsHeader } from "../comments/CommentsHeader";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { useCommentRealtime } from "@/hooks/comments/useCommentRealtime";
import { useLazyComments } from "@/hooks/comments/useLazyComments";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

interface CommentSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  isLoading?: boolean;
  error?: Error | null;
  onLoadComments?: () => void;
}

export function CommentSection({ 
  itemId, 
  comments: initialComments,
  setComments: setParentComments,
  isLoading: parentLoading = false,
  error: parentError = null,
  onLoadComments
}: CommentSectionProps) {
  const { user } = useGlobalAuth();
  const {
    comments,
    setComments,
    isLoading,
    error,
    loadComments,
    isInitialized
  } = useLazyComments(itemId);

  // Load comments when component becomes visible
  useEffect(() => {
    if (onLoadComments) {
      onLoadComments();
    }
    loadComments();
  }, [loadComments, onLoadComments]);

  // Sync comments with parent
  useEffect(() => {
    if (isInitialized) {
      setParentComments(comments);
    }
  }, [comments, setParentComments, isInitialized]);

  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'U')}&background=random`
  } : undefined;
  
  const { isSubscribed } = useCommentRealtime(itemId, comments, setComments);

  const {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment,
    refreshComments
  } = useCommentActions(itemId, comments, setComments, currentUser);

  if (isLoading || parentLoading) {
    return <LoadingComments />;
  }

  return (
    <Card className="mt-4 p-4 shadow-sm border-gray-100">
      <CommentsHeader isSubscribed={isSubscribed} />
      
      <CommentInput 
        onSubmit={handleAddComment} 
        placeholder="Write a comment..." 
        disabled={isLoading}
      />
      
      {(error || parentError) && (
        <CommentsError 
          error={error || parentError} 
          onRetry={refreshComments} 
        />
      )}
      
      {comments.length > 0 ? (
        <div className="mt-4">
          <CommentList
            comments={comments}
            isLoading={false}
            currentUserId={currentUser?.id}
            onLike={handleLikeComment}
            onDelete={handleDeleteComment}
            onEdit={handleEditComment}
            onReply={handleReplyToComment}
            onReport={handleReportComment}
          />
        </div>
      ) : (
        <div className="py-6 text-center text-gray-500">
          <p>No comments yet. Be the first to comment!</p>
        </div>
      )}
    </Card>
  );
}
