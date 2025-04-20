
import { useEffect } from "react";
import { CommentInput } from "./CommentInput";
import { CommentList } from "./CommentList";
import { LoadingComments } from "./LoadingComments";
import { CommentsError } from "./CommentsError";
import { Button } from "@/components/ui/button";
import { RefreshCw, MessageSquare } from "lucide-react";
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
  // Check if comments are really loading - if they're initialized already, we shouldn't show the full loading state
  const isReallyLoading = isLoading && !isInitialized;
  
  // Log comments whenever they change
  useEffect(() => {
    console.log("CommentsPanel rendering with comments:", comments);
    if (currentUser) {
      console.log("Current user:", currentUser);
    }
  }, [comments, currentUser]);
  
  // Comment input should be shown regardless of other states
  const renderCommentInput = () => (
    <CommentInput 
      onSubmit={onAddComment} 
      placeholder="Write a comment..." 
      disabled={!user} 
    />
  );

  // Display loading, error, or comments content based on state
  const renderContent = () => {
    // Show full loading UI only if we're in the initial loading state and have no comments
    if (isReallyLoading && !comments.length) {
      return <div className="mt-4"><LoadingComments /></div>;
    }
    
    // Show error UI only if we have a non-fallback error and no comments
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
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    // Show fallback mode notice if applicable
    if (useFallbackMode && comments.length > 0) {
      return (
        <div className="mt-4">
          <div className="mb-4 px-3 py-2 bg-blue-50 text-blue-800 rounded-md flex items-center text-sm border border-blue-200">
            <MessageSquare className="h-4 w-4 mr-2 flex-shrink-0" />
            <span>Showing community conversation. You can still join the discussion!</span>
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

    // Show normal comments list if we have comments
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

    // Show empty state
    return (
      <div className="py-6 text-center text-gray-500">
        <p>No comments yet. Be the first to comment!</p>
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
