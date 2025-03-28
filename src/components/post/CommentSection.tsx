
import { useEffect } from "react";
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { useCommentData } from "@/hooks/comments/useCommentData";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { Comment } from "@/types/comment";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw } from "lucide-react";
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

  // Attempt to refresh comments if there's an error when component mounts
  useEffect(() => {
    if (error) {
      console.log("Attempting to auto-refresh comments due to error");
      refreshComments();
    }
  }, [error, refreshComments]);

  return (
    <div className="mt-4 space-y-4">
      <CommentInput 
        onSubmit={handleAddComment} 
        placeholder="Write a comment..." 
        disabled={isLoading}
      />
      
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>Failed to load comments</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit flex items-center gap-1"
              onClick={() => refreshComments()}
            >
              <RefreshCw className="h-3 w-3" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <CommentList
        comments={comments || []}
        isLoading={isLoading || dataLoading}
        currentUserId={currentUser?.id}
        onLike={handleLikeComment}
        onDelete={handleDeleteComment}
        onEdit={handleEditComment}
        onReply={handleReplyToComment}
        onReport={handleReportComment}
      />
    </div>
  );
}
