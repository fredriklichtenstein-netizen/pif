
import { useEffect } from "react";
import { Card } from "@/components/ui/card";
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { LoadingComments } from "../comments/LoadingComments";
import { CommentsError } from "../comments/CommentsError";
import { CommentsHeader } from "../comments/CommentsHeader";
import { Button } from "@/components/ui/button";
import { useLazyComments } from "@/hooks/comments/useLazyComments";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { useCommentRealtime } from "@/hooks/comments/useCommentRealtime";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";
import { NetworkStatus } from "../common/NetworkStatus";
import { AlertTriangle, RefreshCw, MessageSquare, Wifi } from "lucide-react";

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

  // Debug logging when component becomes visible
  useEffect(() => {
    if (isVisible) {
      console.log(`LazyCommentsSection: ${isInitialized ? 'Already initialized' : 'Not initialized yet'} for item ${itemId}`);
    }
  }, [isVisible, isInitialized, itemId]);

  // Load comments when component becomes visible
  useEffect(() => {
    if (isVisible && !isInitialized) {
      console.log(`LazyCommentsSection: Loading comments for item ${itemId}`);
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
  } = useCommentActions(itemId, comments, setComments, currentUser);

  // Debug log for component
  useEffect(() => {
    console.log(`LazyCommentsSection for item ${itemId}:`, {
      isVisible,
      isLoading,
      hasError: !!error,
      commentsCount: comments.length,
      isInitialized,
      isSubscribed,
      useFallbackMode
    });
  }, [comments.length, error, isInitialized, isLoading, isSubscribed, isVisible, itemId, useFallbackMode]);

  if (!isVisible) {
    return null;
  }

  // Render appropriate content based on state
  const renderContent = () => {
    // If we're loading and have no comments yet
    if (isLoading && !comments.length) {
      return <LoadingComments />;
    }

    // If we have an error and no comments
    if (error && !comments.length) {
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
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Always show the comment input unless user is not logged in */}
        <CommentInput 
          onSubmit={handleAddComment} 
          placeholder="Write a comment..." 
          disabled={!user} 
        />
        
        {/* Comments list or loading state */}
        {isLoading && !comments.length ? (
          <div className="mt-4">
            <LoadingComments />
          </div>
        ) : comments.length > 0 ? (
          <div className="mt-4">
            {useFallbackMode && (
              <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-800 rounded-md flex items-center text-sm border border-blue-200">
                <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
                <span>Showing community conversation. You can still join the discussion!</span>
              </div>
            )}
            <CommentList
              comments={comments}
              isLoading={isLoading}
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
      </>
    );
  };

  return (
    <Card className="mt-4 p-4 shadow-sm border-gray-100 transition-all duration-300">
      {/* Network status banner at the top */}
      {(error || realtimeError) && (
        <NetworkStatus onRetry={refreshComments} />
      )}
      
      <div className="flex justify-between items-center">
        <CommentsHeader isSubscribed={isSubscribed || useFallbackMode} />
        {onClose && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onClose}
            className="ml-auto"
          >
            Close
          </Button>
        )}
      </div>
      
      {useFallbackMode && (
        <div className="mt-4 px-3 py-2 bg-blue-50 text-blue-700 rounded-md flex items-center text-sm border border-blue-200">
          <Wifi className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Using local conversation mode. Your comments will be stored when connection improves.</span>
        </div>
      )}
      
      {!isSubscribed && isInitialized && !error && !useFallbackMode && (
        <div className="mt-4 px-3 py-2 bg-amber-50 text-amber-800 rounded-md flex items-center text-sm border border-amber-200">
          <AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" />
          <span>Live updates unavailable. Comments may not refresh automatically.</span>
        </div>
      )}
      
      <div className="mt-4">
        {renderContent()}
      </div>
    </Card>
  );
}
