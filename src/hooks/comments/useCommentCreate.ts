
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { formatCommentFromDB } from "@/hooks/item/utils/commentFormatters";
import { v4 as uuidv4 } from "uuid";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";

export const useCommentCreate = (
  itemId: string,
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: {
    id?: string;
    name?: string;
    avatar?: string;
  },
  useFallbackMode = false
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const addDemoComment = useDemoInteractionsStore(state => state.addComment);

  // Format user name as "First name + first letter of last name"
  const formatUserName = (fullName: string): string => {
    if (!fullName) return 'User';
    
    const parts = fullName.split(' ');
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    }
    return fullName;
  };

  // Add a new comment
  const handleAddComment = async (text: string) => {
    console.log('[useCommentCreate] handleAddComment called', {
      text,
      itemId,
      currentUser,
      useFallbackMode,
      DEMO_MODE,
    });

    if (!text.trim()) {
      console.warn('[useCommentCreate] Aborted: empty text');
      return;
    }
    if (!currentUser || !currentUser.id) {
      console.warn('[useCommentCreate] Aborted: no currentUser.id', currentUser);
      return;
    }

    setIsLoading(true);

    try {
      // Demo mode: add to local store
      if (DEMO_MODE) {
        const displayName = formatUserName(currentUser.name || 'Demo User');
        const newComment = addDemoComment(itemId, text.trim(), {
          id: currentUser.id,
          name: displayName,
          avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
        });

        setComments([...comments, newComment]);

        setIsLoading(false);
        return;
      }

      // If in fallback mode, create a local comment
      if (useFallbackMode) {
        const displayName = formatUserName(currentUser.name || '');

        const tempComment: Comment = {
          id: `local-${uuidv4()}`,
          text: text.trim(),
          author: {
            id: currentUser.id,
            name: displayName,
            avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
          },
          createdAt: new Date(),
          likes: 0,
          isLiked: false,
          replies: [],
          isOwn: true,
          isPending: true
        };

        const updatedComments = [...comments, tempComment];
        setComments(updatedComments);

        try {
          const pendingComments = JSON.parse(localStorage.getItem(`pending_comments_${itemId}`) || '[]');
          pendingComments.push({
            id: tempComment.id,
            itemId,
            content: text.trim(),
            userId: currentUser.id,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem(`pending_comments_${itemId}`, JSON.stringify(pendingComments));
        } catch (err) {
          console.error("Failed to store pending comment in localStorage:", err);
        }

        setIsLoading(false);
        return;
      }

      // Regular online mode - send to server
      const numericItemId = parseInt(itemId, 10);
      console.log('[useCommentCreate] Parsing itemId', { itemId, numericItemId });
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }

      const insertPayload = {
        item_id: numericItemId,
        user_id: currentUser.id,
        content: text.trim(),
      };
      console.log('[useCommentCreate] Inserting comment payload', insertPayload);

      const { data, error } = await supabase
        .from('comments')
        .insert(insertPayload)
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
        .single();

      if (error) {
        console.error('[useCommentCreate] Supabase insert error', error);
        throw error;
      }

      console.log('[useCommentCreate] Insert success', data);

      if (data) {
        const newComment = formatCommentFromDB(data, true);
        const updatedComments = [...comments, newComment];
        setComments(updatedComments);
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast({
        title: t('post.error'),
        description: t('interactions.comment_add_error'),
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    handleAddComment,
    isCreating: isLoading
  };
};
