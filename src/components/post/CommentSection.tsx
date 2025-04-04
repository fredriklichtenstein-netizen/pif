
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
  const [refreshCount, setRefreshCount] = useState(0);
  
  const {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment,
    refreshComments,
    isLoading: actionLoading
  } = useCommentActions(itemId, comments, setComments, currentUser);

  // Handle manual refresh with debouncing
  const handleRefresh = () => {
    if (actionLoading) return; // Prevent multiple clicks
    
    setErrorShown(true);
    setRefreshCount((prev) => prev + 1);
    refreshComments();
  };

  // Track when we've shown the error to prevent multiple error displays
  useEffect(() => {
    if (error && !errorShown) {
      setErrorShown(true);
      
      // Only auto-retry on the first error
      if (refreshCount === 0) {
        console.log("Auto-retrying comment fetch after error");
        const timeoutId = setTimeout(() => {
          refreshComments();
          setRefreshCount(1);
        }, 3000); // Auto-retry after 3 seconds
        
        return () => clearTimeout(timeoutId);
      }
    } else if (!error) {
      setErrorShown(false);
      if (refreshCount > 0) {
        setRefreshCount(0);
      }
    }
  }, [error, errorShown, refreshCount, refreshComments]);

  // Combined loading state
  const isLoadingComments = isLoading || dataLoading || actionLoading;

  return (
    <div className="mt-4 space-y-4">
      <CommentInput 
        onSubmit={handleAddComment} 
        placeholder="Write a comment..." 
        disabled={isLoadingComments}
      />
      
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Comments Loading Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{error.message || "Failed to load comments"}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="w-fit flex items-center gap-1"
              onClick={handleRefresh}
              disabled={isLoadingComments}
            >
              <RefreshCw className="h-3 w-4" /> Try again
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {isLoadingComments ? (
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
