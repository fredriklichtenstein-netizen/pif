
import { useEffect, useState, useCallback } from "react";
import { CommentInput } from "../comments/CommentInput";
import { CommentList } from "../comments/CommentList";
import { useCommentActions } from "@/hooks/comments/useCommentActions";
import { useCommentRealtime } from "@/hooks/comments/useCommentRealtime";
import { Comment } from "@/types/comment";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, RefreshCw, Loader2, Wifi } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useGlobalAuth } from "@/hooks/useGlobalAuth";

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
  const { user } = useGlobalAuth();
  const [loading, setLoading] = useState(isLoading);
  const [errorState, setErrorState] = useState<Error | null>(error);
  const [errorShown, setErrorShown] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);
  
  // Current user data for comments
  const currentUser = user ? {
    id: user.id,
    name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
    avatar: user.user_metadata?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.user_metadata?.full_name || 'U')}&background=random`
  } : undefined;
  
  // Add real-time subscription
  const { isSubscribed, error: realtimeError } = useCommentRealtime(itemId, comments, setComments);
  
  // Fetch comments when component mounts
  const fetchComments = useCallback(async () => {
    if (!itemId) return;
    
    setLoading(true);
    setErrorState(null);
    
    try {
      console.log(`Fetching comments for item ${itemId}`);
      
      const numericId = parseInt(itemId);
      if (isNaN(numericId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      const { data, error } = await supabase
        .from('comments')
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            id,
            first_name,
            last_name,
            avatar_url
          )
        `)
        .eq('item_id', numericId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!data) {
        console.log("No comments found");
        setComments([]);
        return;
      }
      
      // Transform data to Comment type
      const formattedComments = data.map(comment => {
        const profile = comment.profiles as any;
        const fullName = profile 
          ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User' 
          : 'User';
        
        return {
          id: comment.id.toString(),
          text: comment.content,
          author: {
            id: comment.user_id,
            name: fullName,
            avatar: profile?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=random`
          },
          likes: 0,
          isLiked: false,
          replies: [],
          createdAt: new Date(comment.created_at),
          isOwn: comment.user_id === user?.id
        };
      });
      
      console.log(`Fetched ${formattedComments.length} comments`);
      setComments(formattedComments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      setErrorState(error instanceof Error ? error : new Error('Unknown error fetching comments'));
    } finally {
      setLoading(false);
    }
  }, [itemId, setComments, user?.id]);
  
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

  // Load comments when component mounts
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  // Handle manual refresh
  const handleRefresh = () => {
    if (loading || actionLoading) return; // Prevent multiple clicks
    
    setErrorShown(true);
    setRefreshCount((prev) => prev + 1);
    fetchComments();
  };

  // Track when we've shown the error to prevent multiple error displays
  useEffect(() => {
    if ((errorState || realtimeError) && !errorShown) {
      setErrorShown(true);
      
      // Only auto-retry on the first error
      if (refreshCount === 0) {
        console.log("Auto-retrying comment fetch after error");
        const timeoutId = setTimeout(() => {
          fetchComments();
          setRefreshCount(1);
        }, 3000); // Auto-retry after 3 seconds
        
        return () => clearTimeout(timeoutId);
      }
    } else if (!errorState && !realtimeError) {
      setErrorShown(false);
      if (refreshCount > 0) {
        setRefreshCount(0);
      }
    }
  }, [errorState, realtimeError, errorShown, refreshCount, fetchComments]);

  // Combined loading state
  const isLoadingComments = loading || actionLoading;

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
        disabled={isLoadingComments}
      />
      
      {(errorState || realtimeError) && (
        <Alert variant="destructive" className="mt-4 mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Comments Loading Error</AlertTitle>
          <AlertDescription className="flex flex-col gap-2">
            <p>{(errorState || realtimeError)?.message || "Failed to load comments"}</p>
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
