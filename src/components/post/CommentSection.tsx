import { useEffect, useState } from "react";
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { useCommentRealtime } from "@/hooks/comments/useCommentRealtime";
import { useLazyComments } from "@/hooks/comments/useLazyComments";
import { Comment } from "@/types/comment";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Loader2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
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

  const [loading, setLoading] = useState(false);
  const [errorState, setErrorState] = useState<Error | null>(null);
  const [errorShown, setErrorShown] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Current user data for comments
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
    handleReportComment,
    refreshComments: actionsRefreshComments,
    isLoading: actionLoading
  } = useCommentActions(itemId, comments, setComments, currentUser);

  // Show loading state while initially fetching comments
  if (isLoading || parentLoading) {
    return (
      <Card className="mt-4 p-4 shadow-sm border-gray-100">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-gray-500">Loading comments...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="mt-4 p-4 shadow-sm border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-medium">Comments</h3>
        {isSubscribed && (
          <Badge variant="outline" className="flex items-center gap-1 text-xs bg-green-50 text-green-700 border-green-200">
            <Wifi className="h-3 w-3" />
            Live
          </Badge>
        )}
      </div>
      
      <CommentInput 
        onSubmit={handleAddComment} 
        placeholder="Write a comment..." 
        disabled={isLoading}
      />
      
      {(error || realtimeError) && (
        <Alert variant="destructive" className="mt-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Comments Loading Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{(error || realtimeError)?.message || "Failed to load comments"}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit flex items-center gap-1"
              onClick={() => {
                actionsRefreshComments();
              }}
              disabled={isLoading}
            >
              <RefreshCw className="h-3 w-4" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : comments.length > 0 ? (
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
