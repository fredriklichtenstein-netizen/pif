
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { useLazyComments } from "@/hooks/comments/useLazyComments";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { useCommentRealtime } from "@/hooks/comments/useCommentRealtime";
import { useCommentLikesRealtime } from "@/hooks/comments/useCommentLikesRealtime";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { CommentsPanel } from "./CommentsPanel";
import { CommentsBannerSection } from "./CommentsBannerSection";

interface LazyCommentsSectionProps {
  itemId: string;
  isVisible: boolean;
  onClose?: () => void;
}

export function LazyCommentsSection({ 
  itemId,
  isVisible,
  onClose
}: LazyCommentsSectionProps) {
  const { user } = useGlobalAuth();
  const {
    comments,
    setComments,
    isLoading,
    error,
    refreshComments,
    isInitialized,
    useFallbackMode
  } = useLazyComments(itemId);

  // Tracks the most recently added comment id so we can smoothly scroll to it.
  const [highlightedCommentId, setHighlightedCommentId] = useState<string | null>(null);

  useEffect(() => {
    if (!isVisible) return;
    refreshComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible, itemId]);

  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'U')}&background=random`
  } : undefined;

  const { isSubscribed, error: realtimeError } = useCommentRealtime(itemId, comments, setComments, refreshComments);
  useCommentLikesRealtime(itemId, comments, setComments);

  const {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment
  } = useCommentActions(itemId, comments, setComments, currentUser, useFallbackMode);

  // Optimistic add — no flicker, no full refetch. Realtime fills in for others.
  const handleAddCommentSmooth = async (text: string) => {
    const result: any = await handleAddComment(text);
    if (result?.id) setHighlightedCommentId(String(result.id));
    return result;
  };

  const handleReplySmooth = async (commentId: string, text: string) => {
    const result: any = await handleReplyToComment(commentId, text);
    if (result?.id) setHighlightedCommentId(String(result.id));
    return result;
  };

  if (!isVisible) return null;

  return (
    <Card className="mt-4 p-4 shadow-sm border-gray-100 transition-all duration-300">
      <CommentsBannerSection
        error={error}
        realtimeError={realtimeError}
        refreshComments={refreshComments}
        isSubscribed={isSubscribed}
        onClose={onClose}
        useFallbackMode={useFallbackMode}
        isInitialized={isInitialized}
      />
      <div className="mt-4">
        <CommentsPanel
          user={user}
          isLoading={isLoading}
          error={error}
          comments={comments}
          useFallbackMode={useFallbackMode}
          isInitialized={isInitialized}
          currentUser={currentUser}
          onAddComment={handleAddCommentSmooth}
          onLike={handleLikeComment}
          onDelete={handleDeleteComment}
          onEdit={handleEditComment}
          onReply={handleReplySmooth}
          onReport={handleReportComment}
          refreshComments={refreshComments}
          newCommentId={highlightedCommentId}
        />
      </div>
    </Card>
  );
}
