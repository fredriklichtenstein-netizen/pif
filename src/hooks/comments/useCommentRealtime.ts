
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Comment } from '@/types/comment';
import { formatCommentFromDB } from '@/hooks/item/utils/commentFormatters';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

const POLL_INTERVAL_MS = 15000;

export const useCommentRealtime = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  refreshComments?: () => void
) => {
  const isSubscribedRef = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !refreshComments) return;
    pollTimerRef.current = setInterval(() => {
      if (!isSubscribedRef.current) {
        refreshComments();
      }
    }, POLL_INTERVAL_MS);
  }, [refreshComments]);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [subscriptionAttempts, setSubscriptionAttempts] = useState(0);
  const [channel, setChannel] = useState<ReturnType<typeof supabase.channel> | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();
  const MAX_SUBSCRIPTION_ATTEMPTS = 3;

  // Add comment to the list (for inserts)
  const handleCommentInsert = useCallback((newComment: any) => {
    const formattedComment = formatCommentFromDB(newComment, newComment.user_id === user?.id);
    
    // Check for duplicates before adding
    if (!comments.some(c => c.id === formattedComment.id)) {
      const updatedComments = [...comments, formattedComment];
      setComments(updatedComments);
      
      // Show toast for new comments from others
      if (newComment.user_id !== user?.id) {
        toast({
          title: t('interactions.new_comment'),
          description: t('interactions.new_comment_description', { name: formattedComment.author.name }),
        });
      }
    }
  }, [comments, user?.id, setComments, toast]);

  // Update an existing comment (for updates)
  const handleCommentUpdate = useCallback((updatedComment: any) => {
    const updatedComments = comments.map(comment => 
      comment.id === updatedComment.id.toString()
        ? formatCommentFromDB(updatedComment, updatedComment.user_id === user?.id)
        : comment
    );
    setComments(updatedComments);
  }, [comments, user?.id, setComments]);

  // Remove a comment from the list (for deletes)
  const handleCommentDelete = useCallback((deletedComment: any) => {
    const filteredComments = comments.filter(comment => 
      comment.id !== deletedComment.id.toString()
    );
    setComments(filteredComments);
  }, [comments, setComments]);

  // Clean up function for supabase channels
  const cleanupChannel = useCallback(() => {
    if (channel) {
      supabase.removeChannel(channel);
      setChannel(null);
    } else {
    }
  }, [channel, itemId]);

  useEffect(() => {
    if (!itemId || subscriptionAttempts >= MAX_SUBSCRIPTION_ATTEMPTS) {
      if (subscriptionAttempts >= MAX_SUBSCRIPTION_ATTEMPTS) {
      }
      return;
    }
    
    try {
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`[useCommentRealtime] Invalid item ID: ${itemId}`);
      }
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
          handleCommentInsert(payload.new);
        })
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          handleCommentUpdate(payload.new);
        })
        .on('postgres_changes', {
          event: 'DELETE',
          schema: 'public',
          table: 'comments',
          filter: `item_id=eq.${numericItemId}`,
        }, (payload) => {
          handleCommentDelete(payload.old);
        });
        
      // Setup subscription status handling — failures are non-fatal.
      // Comments still work via regular fetch/refetch without realtime.
      try {
        newChannel.subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            setIsSubscribed(true);
            setError(null);
            setSubscriptionAttempts(0);
          } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
            // Silent: comments work without realtime
            setIsSubscribed(false);
          }
        });
      } catch (subErr) {
        // Silent: subscription failure should not break comments
        setIsSubscribed(false);
      }

      setChannel(newChannel);

      return () => {
        cleanupChannel();
      };
    } catch (error) {
      // Silent: realtime is optional, comments still load via fetch
      setIsSubscribed(false);
    }
  }, [itemId, handleCommentInsert, handleCommentUpdate, handleCommentDelete, cleanupChannel, subscriptionAttempts]);

  return {
    isSubscribed,
    error
  };
};
