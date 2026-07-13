
import { useState, useEffect, useCallback, useRef } from 'react';
import { Comment } from '@/types/comment';
import { formatCommentFromDB } from '@/hooks/item/utils/commentFormatters';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import {
  subscribeItemTable,
  subscribeItemStatus,
} from '@/services/realtime/itemRealtimeManager';

// Realtime postgres_changes payloads only ever carry raw table columns —
// never a joined `profiles` relation — so any comment arriving via realtime
// needs its author profile fetched separately, otherwise it renders as
// "Anonymous" even though the commenter has a real name/avatar (which a
// plain REST fetch, with its join, resolves correctly).
const withProfile = async (row: any) => {
  if (row.profiles) return row;
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, avatar_url')
    .eq('id', row.user_id)
    .maybeSingle();
  return { ...row, profiles: profile ?? null };
};

const POLL_INTERVAL_MIN_MS = 15000;
const POLL_INTERVAL_MAX_MS = 120000;

/**
 * Subscribes to comments changes for an item, with polling fallback when
 * realtime is unavailable. Backed by the shared per-item channel manager
 * so multiple comment panels for the same item reuse one Supabase channel.
 */
export const useCommentRealtime = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  refreshComments?: () => void
) => {
  const isSubscribedRef = useRef(false);
  const pollTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pollDelayRef = useRef<number>(POLL_INTERVAL_MIN_MS);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearTimeout(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const startPolling = useCallback(() => {
    if (pollTimerRef.current || !refreshComments) return;

    const schedule = () => {
      pollTimerRef.current = setTimeout(async () => {
        pollTimerRef.current = null;
        if (isSubscribedRef.current) return;
        try {
          await Promise.resolve(refreshComments());
          pollDelayRef.current = POLL_INTERVAL_MIN_MS;
        } catch (err) {
          pollDelayRef.current = Math.min(
            pollDelayRef.current * 2,
            POLL_INTERVAL_MAX_MS
          );
          console.warn(
            `[useCommentRealtime] Poll failed, backing off to ${pollDelayRef.current}ms`
          );
        }
        if (!isSubscribedRef.current) schedule();
      }, pollDelayRef.current);
    };

    pollDelayRef.current = POLL_INTERVAL_MIN_MS;
    schedule();
  }, [refreshComments]);

  const [isSubscribed, setIsSubscribed] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Stable refs so the manager callbacks always see latest values without
  // re-subscribing (which would defeat the shared-channel purpose).
  const commentsRef = useRef(comments);
  commentsRef.current = comments;
  const setCommentsRef = useRef(setComments);
  setCommentsRef.current = setComments;
  const userIdRef = useRef(user?.id);
  userIdRef.current = user?.id;

  const handleCommentInsert = useCallback(async (newComment: any) => {
    const myId = userIdRef.current;
    const commentWithProfile = await withProfile(newComment);
    const list = commentsRef.current;
    const setList = setCommentsRef.current;
    const formattedComment = formatCommentFromDB(commentWithProfile, commentWithProfile.user_id === myId);
    const parentId = commentWithProfile.parent_id ? String(commentWithProfile.parent_id) : null;

    if (parentId) {
      const exists = list.some(c => c.replies?.some(r => r.id === formattedComment.id));
      if (exists) return;
      setList(list.map(c =>
        c.id === parentId
          ? { ...c, replies: [...(c.replies ?? []), formattedComment] }
          : c
      ));

      if (commentWithProfile.user_id !== myId) {
        toast({
          title: t('interactions.new_comment'),
          description: t('interactions.new_comment_description', { name: formattedComment.author.name }),
        });
      }
      return;
    }

    if (!list.some(c => c.id === formattedComment.id)) {
      setList([...list, formattedComment]);

      if (commentWithProfile.user_id !== myId) {
        toast({
          title: t('interactions.new_comment'),
          description: t('interactions.new_comment_description', { name: formattedComment.author.name }),
        });
      }
    }
  }, [toast, t]);

  const handleCommentUpdate = useCallback(async (updatedComment: any) => {
    const myId = userIdRef.current;
    const commentWithProfile = await withProfile(updatedComment);
    const list = commentsRef.current;
    const setList = setCommentsRef.current;
    const formatted = formatCommentFromDB(commentWithProfile, commentWithProfile.user_id === myId);
    const targetId = String(commentWithProfile.id);
    setList(list.map(c => {
      if (c.id === targetId) return { ...formatted, replies: c.replies, likes: c.likes, isLiked: c.isLiked };
      if (c.replies?.some(r => r.id === targetId)) {
        return {
          ...c,
          replies: c.replies.map(r =>
            r.id === targetId ? { ...formatted, likes: r.likes, isLiked: r.isLiked } : r
          ),
        };
      }
      return c;
    }));
  }, []);

  const handleCommentDelete = useCallback((deletedComment: any) => {
    const list = commentsRef.current;
    const setList = setCommentsRef.current;
    const targetId = String(deletedComment.id);
    setList(
      list
        .filter(c => c.id !== targetId)
        .map(c =>
          c.replies?.some(r => r.id === targetId)
            ? { ...c, replies: c.replies.filter(r => r.id !== targetId) }
            : c
        )
    );
  }, []);

  useEffect(() => {
    if (!itemId) return;
    const numericItemId = parseInt(itemId);
    if (isNaN(numericItemId)) {
      setError(new Error(`[useCommentRealtime] Invalid item ID: ${itemId}`));
      return;
    }

    const unsubscribe = subscribeItemTable(itemId, 'comments', (payload) => {
      const ev = payload.eventType;
      if (ev === 'INSERT') handleCommentInsert(payload.new);
      else if (ev === 'UPDATE') handleCommentUpdate(payload.new);
      else if (ev === 'DELETE') handleCommentDelete(payload.old);
    });

    const unsubscribeStatus = subscribeItemStatus(itemId, (status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        setIsSubscribed(true);
        setError(null);
        stopPolling();
      } else if (
        status === 'CHANNEL_ERROR' ||
        status === 'TIMED_OUT' ||
        status === 'CLOSED'
      ) {
        isSubscribedRef.current = false;
        setIsSubscribed(false);
        startPolling();
      }
    });

    return () => {
      unsubscribe();
      unsubscribeStatus();
      stopPolling();
    };
  }, [itemId, handleCommentInsert, handleCommentUpdate, handleCommentDelete, startPolling, stopPolling]);

  return {
    isSubscribed,
    error,
  };
};
