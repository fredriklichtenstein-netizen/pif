
import { useEffect, useState } from "react";
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { useCommentData } from "@/hooks/comments/useCommentData";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { Comment } from "@/types/comment";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface CommentSectionProps {
  itemId: string;
  comments: Comment[];
  setComments: (comments: Comment[]) => void;
  isLoading?: boolean;
  error?: Error | null;
}

export function CommentSection({ 
  itemId, 
  comments, 
  setComments,
  isLoading = false,
  error = null
}: CommentSectionProps) {
  const { isLoading: dataLoading, currentUser } = useCommentData(itemId);
  const [errorShown, setErrorShown] = useState(false);
  
  const {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment,
    refreshComments
  } = useCommentActions(itemId, comments, setComments, currentUser);

  // Add this debug log to check comments data
  console.log("CommentSection rendered", { 
    itemId, 
    commentsCount: comments?.length, 
    comments,
    isLoading,
    error 
  });

  // Track when we've shown the error to prevent multiple error displays
  useEffect(() => {
    if (error && !errorShown) {
      setErrorShown(true);
      setTimeout(() => {
        refreshComments();
      }, 5000); // Auto-retry after 5 seconds
    } else if (!error) {
      setErrorShown(false);
    }
  }, [error, errorShown, refreshComments]);

  return (
    <div className="mt-4 space-y-4">
      <CommentInput 
        onSubmit={handleAddComment} 
        placeholder="Write a comment..." 
        disabled={isLoading || dataLoading}
      />
      
      {error && !errorShown && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>Failed to load comments</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit flex items-center gap-1"
              onClick={() => {
                refreshComments();
                setErrorShown(true);
              }}
            >
              <RefreshCw className="h-3 w-4" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoading || dataLoading ? (
        <div className="flex flex-col items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
          <p className="text-gray-500">Loading comments...</p>
        </div>
      ) : (
        <CommentList
          comments={comments || []}
          isLoading={false}
          currentUserId={currentUser?.id}
          onLike={handleLikeComment}
          onDelete={handleDeleteComment}
          onEdit={handleEditComment}
          onReply={handleReplyToComment}
          onReport={handleReportComment}
        />
      )}
    </div>
  );
}
