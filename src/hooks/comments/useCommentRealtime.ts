
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '@/types/comment';
import { formatCommentFromDB } from '@/hooks/item/utils/commentFormatters';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export const useCommentRealtime = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void
) => {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionAttempts, setSubscriptionAttempts] = useState(0);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const MAX_SUBSCRIPTION_ATTEMPTS = 3;

  // Add comment to the list (for inserts)
  const handleCommentInsert = useCallback((newComment: any) => {
    const formattedComment = formatCommentFromDB(newComment, newComment.user_id === user?.id);
    
    // Check for duplicates before adding
    if (!comments.some(c => c.id === formattedComment.id)) {
      console.log("[useCommentRealtime] Real-time: Adding new comment", formattedComment.id);
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
    console.log("[useCommentRealtime] Real-time: Updating comment", updatedComment.id);
    const updatedComments = comments.map(comment => 
      comment.id === updatedComment.id.toString()
        ? formatCommentFromDB(updatedComment, updatedComment.user_id === user?.id)
        : comment
    );
    setComments(updatedComments);
  }, [comments, user?.id, setComments]);

  // Remove a comment from the list (for deletes)
  const handleCommentDelete = useCallback((deletedComment: any) => {
    console.log("[useCommentRealtime] Real-time: Deleting comment", deletedComment.id);
    const filteredComments = comments.filter(comment => 
      comment.id !== deletedComment.id.toString()
    );
    setComments(filteredComments);
  }, [comments, setComments]);

  // Clean up function for supabase channels
  const cleanupChannel = useCallback(() => {
    if (channel) {
      console.log(`[useCommentRealtime] Cleaning up real-time subscription for item ${itemId}`);
      supabase.removeChannel(channel);
      setChannel(null);
    } else {
      console.log(`[useCommentRealtime] No channels to clean up for item ${itemId}`);
    }
  }, [channel, itemId]);

  useEffect(() => {
    if (!itemId || subscriptionAttempts >= MAX_SUBSCRIPTION_ATTEMPTS) {
      if (subscriptionAttempts >= MAX_SUBSCRIPTION_ATTEMPTS) {
        console.log(`[useCommentRealtime] Max subscription attempts (${MAX_SUBSCRIPTION_ATTEMPTS}) reached for item ${itemId}`);
      }
      return;
    }
    
    try {
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`[useCommentRealtime] Invalid item ID: ${itemId}`);
      }
      
      console.log(`[useCommentRealtime] Setting up real-time subscription for comments on item ${numericItemId} (attempt ${subscriptionAttempts + 1})`);
      
      // Clean up existing subscription if any
      cleanupChannel();
      
      const newChannel = supabase
        .channel(`comments-${numericItemId}-${Date.now()}`) // Add timestamp to make channel name unique
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('[useCommentRealtime] Real-time comment INSERT received:', payload.new.id);
          handleCommentInsert(payload.new);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('[useCommentRealtime] Real-time comment UPDATE received:', payload.new.id);
          handleCommentUpdate(payload.new);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          console.log('[useCommentRealtime] Real-time comment DELETE received:', payload.old.id);
          handleCommentDelete(payload.old);
        });
        
      // Setup subscription status handling
      newChannel.subscribe((status) => {
        console.log(`[useCommentRealtime] Subscription status for item ${itemId}:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log('[useCommentRealtime] Successfully subscribed to real-time comments');
          setIsSubscribed(true);
          setError(null);
          setSubscriptionAttempts(0); // Reset attempts counter on success
        } else if (status === 'CHANNEL_ERROR') {
          console.error('[useCommentRealtime] Failed to subscribe to real-time comments');
          setIsSubscribed(false);
          setError(new Error('Failed to connect to real-time updates'));
          
          // Increment attempts and try again after delay if not at max attempts
          if (subscriptionAttempts < MAX_SUBSCRIPTION_ATTEMPTS - 1) {
            const nextAttempt = subscriptionAttempts + 1;
            setSubscriptionAttempts(nextAttempt);
            
            // Try with increasing delays
            const retryDelay = 1000 * Math.pow(2, nextAttempt);
            console.log(`[useCommentRealtime] Will retry in ${retryDelay}ms (attempt ${nextAttempt + 1}/${MAX_SUBSCRIPTION_ATTEMPTS})`);
          }
        }
      });
      
      setChannel(newChannel);

      return () => {
        cleanupChannel();
      };
    } catch (error) {
      console.error('[useCommentRealtime] Error in real-time subscription:', error);
      setError(error instanceof Error ? error : new Error('Unknown error'));
      setIsSubscribed(false);
      
      // Increment attempts counter
      if (subscriptionAttempts < MAX_SUBSCRIPTION_ATTEMPTS - 1) {
        setSubscriptionAttempts(prevAttempts => prevAttempts + 1);
      }
    }
  }, [itemId, handleCommentInsert, handleCommentUpdate, handleCommentDelete, cleanupChannel, subscriptionAttempts]);

  return {
    isSubscribed,
    error
  };
};
