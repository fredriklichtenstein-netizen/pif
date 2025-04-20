
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
    
    // Check for duplicates before adding
    if (!comments.some(c => c.id === formattedComment.id)) {
      console.log("Real-time: Adding new comment", formattedComment);
      const updatedComments = [...comments, formattedComment];
      setComments(updatedComments);
      
      // Show toast for new comments from others
      if (newComment.user_id !== user?.id) {
        toast({
          title: "New Comment",
          description: `${formattedComment.author.name} added a comment`,
        });
      }
    }
  }, [comments, user?.id, setComments, toast]);

  // Update an existing comment (for updates)
  const handleCommentUpdate = useCallback((updatedComment: any) => {
    console.log("Real-time: Updating comment", updatedComment);
    const updatedComments = comments.map(comment => 
      comment.id === updatedComment.id.toString()
        ? formatCommentFromDB(updatedComment, updatedComment.user_id === user?.id)
        : comment
    );
    setComments(updatedComments);
  }, [comments, user?.id, setComments]);

  // Remove a comment from the list (for deletes)
  const handleCommentDelete = useCallback((deletedComment: any) => {
    console.log("Real-time: Deleting comment", deletedComment);
    const filteredComments = comments.filter(comment => 
      comment.id !== deletedComment.id.toString()
    );
    setComments(filteredComments);
  }, [comments, setComments]);

  useEffect(() => {
    if (!itemId) return;
    
    try {
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log('Setting up real-time subscription for comments on item', numericItemId);
      
      const channel = supabase
        .channel(`comments-${numericItemId}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('Real-time comment INSERT received:', payload);
          handleCommentInsert(payload.new);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('Real-time comment UPDATE received:', payload);
          handleCommentUpdate(payload.new);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('Real-time comment DELETE received:', payload);
          handleCommentDelete(payload.old);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('Successfully subscribed to real-time comments');
            setIsSubscribed(true);
            setError(null);
          } else if (status === 'CHANNEL_ERROR') {
            console.error('Failed to subscribe to real-time comments');
            setIsSubscribed(false);
            setError(new Error('Failed to connect to real-time updates'));
          }
        });

      return () => {
        console.log('Cleaning up real-time subscription');
        supabase.removeChannel(channel);
        setIsSubscribed(false);
      };
    } catch (error) {
      console.error('Error in real-time subscription:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setIsSubscribed(false);
    }
  }, [itemId, handleCommentInsert, handleCommentUpdate, handleCommentDelete]);

  return {
    isSubscribed,
    error
  };
};
