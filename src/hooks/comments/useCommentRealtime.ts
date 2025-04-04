
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '@/types/comment';
import { formatCommentFromDB } from '@/hooks/item/utils/commentFormatters';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useToast } from '@/hooks/use-toast';

export const useCommentRealtime = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void
) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();

  // Add comment to the list (for inserts)
  const handleCommentInsert = useCallback((newComment: any) => {
    const formattedComment = formatCommentFromDB(newComment, newComment.user_id === user?.id);
    
    // Don't add duplicate comments
    if (comments.some(c => c.id === formattedComment.id)) return;
    
    setComments([...comments, formattedComment]);
    
    // Optionally show a toast notification for new comments (only if not from current user)
    if (newComment.user_id !== user?.id) {
      toast({
        title: "New Comment",
        description: `${formattedComment.author.name} added a comment`,
      });
    }
  }, [comments, setComments, user?.id, toast]);

  // Update an existing comment (for updates)
  const handleCommentUpdate = useCallback((updatedComment: any) => {
    setComments(comments.map(comment => {
      if (comment.id === updatedComment.id.toString()) {
        const formattedComment = formatCommentFromDB(updatedComment, updatedComment.user_id === user?.id);
        return formattedComment;
      }
      return comment;
    }));
  }, [comments, setComments, user?.id]);

  // Remove a comment from the list (for deletes)
  const handleCommentDelete = useCallback((deletedComment: any) => {
    setComments(comments.filter(comment => comment.id !== deletedComment.id.toString()));
  }, [comments, setComments]);

  // Set up real-time subscription
  useEffect(() => {
    if (!itemId || isSubscribed) return;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Setting up real-time subscription for comments on item ${numericItemId}`);

      // Subscribe to all changes (INSERT, UPDATE, DELETE) for this item
      const channel = supabase
        .channel('comment-changes')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('Real-time comment INSERT:', payload);
          handleCommentInsert(payload.new);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('Real-time comment UPDATE:', payload);
          handleCommentUpdate(payload.new);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('Real-time comment DELETE:', payload);
          handleCommentDelete(payload.old);
        })
        .subscribe((status) => {
          console.log(`Real-time subscription status: ${status}`);
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
          }
        });

      // Clean up subscription when component unmounts
      return () => {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      };
    } catch (error) {
      console.error('Error setting up real-time subscription:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setIsSubscribed(false);
    }
  }, [itemId, isSubscribed, handleCommentInsert, handleCommentUpdate, handleCommentDelete]);

  return {
    isSubscribed,
    error
  };
};
