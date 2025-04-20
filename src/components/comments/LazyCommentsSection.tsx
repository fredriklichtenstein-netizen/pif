
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useLazyComments } from "@/hooks/comments/useLazyComments";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { useCommentRealtime } from "@/hooks/comments/useCommentRealtime";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { CommentsPanel } from "./CommentsPanel";
import { CommentsBannerSection } from "./CommentsBannerSection";
import type { Comment } from "@/types/comment";

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
    loadComments,
    refreshComments,
    isInitialized,
    useFallbackMode
  } = useLazyComments(itemId);

  useEffect(() => {
    if (isVisible && !isInitialized) {
      loadComments();
    }
  }, [isVisible, loadComments, isInitialized, itemId]);

  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'U')}&background=random`
  } : undefined;

  const { isSubscribed, error: realtimeError } = useCommentRealtime(itemId, comments, setComments);

  const {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment
  } = useCommentActions(itemId, comments, setComments, currentUser, useFallbackMode);

  useEffect(() => {
    // Only process local comments if in fallback mode and we have a current user
    if (useFallbackMode && currentUser?.id && isInitialized) {
      try {
        const pendingCommentsJson = localStorage.getItem(`pending_comments_${itemId}`);
        if (!pendingCommentsJson) return;
        const pendingComments = JSON.parse(pendingCommentsJson);
        if (!Array.isArray(pendingComments) || pendingComments.length === 0) return;
        const existingIds = new Set(comments.map(c => c.id));
        const newPendingComments = pendingComments.filter(pc => !existingIds.has(pc.id));
        if (newPendingComments.length > 0) {
          const formattedComments = newPendingComments.map((pc: any) => ({
            id: pc.id,
            text: pc.content,
            author: {
              id: currentUser.id,
              name: currentUser.name || 'User',
              avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'U')}&background=random`
            },
            createdAt: new Date(pc.createdAt),
            likes: 0,
            isLiked: false,
            replies: [],
            isOwn: true,
            isPending: true
          }));
          setComments([...comments, ...formattedComments]);
        }
      } catch (err) {
        console.error("Error processing pending comments:", err);
      }
    }
  }, [useFallbackMode, currentUser, itemId, isInitialized, comments, setComments]);

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
          onAddComment={handleAddComment}
          onLike={handleLikeComment}
          onDelete={handleDeleteComment}
          onEdit={handleEditComment}
          onReply={handleReplyToComment}
          onReport={handleReportComment}
          refreshComments={refreshComments}
        />
      </div>
    </Card>
  );
}
