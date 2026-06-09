
import { useState } from "react";
import { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import { formatCommentFromDB } from "@/hooks/item/utils/commentFormatters";
import { v4 as uuidv4 } from "uuid";
import { DEMO_MODE } from "@/config/demoMode";
import { useDemoInteractionsStore } from "@/stores/demoInteractionsStore";
import { useInitialCountsStore } from "@/stores/initialCountsStore";

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

  // Add a new comment (or reply when parentId is provided)
  const handleAddComment = async (text: string, parentId?: string) => {
    if (!text.trim()) return;
    if (!currentUser || !currentUser.id) return;

    setIsLoading(true);

    try {
      // Demo mode: add to local store (no parent threading in demo).
      if (DEMO_MODE) {
        const displayName = formatUserName(currentUser.name || 'Demo User');
        const newComment = addDemoComment(itemId, text.trim(), {
          id: currentUser.id,
          name: displayName,
          avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
        });

        if (parentId) {
          setComments(comments.map(c =>
            c.id === parentId ? { ...c, replies: [...c.replies, newComment] } : c
          ));
        } else {
          setComments([...comments, newComment]);
        }

        setIsLoading(false);
        return newComment;
      }

      // Fallback (offline) mode: only top-level allowed; replies require server.
      if (useFallbackMode && !parentId) {
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

        setComments([...comments, tempComment]);

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
        return tempComment;
      }

      const numericItemId = parseInt(itemId, 10);
      if (isNaN(numericItemId)) throw new Error(`Invalid item ID: ${itemId}`);

      const insertPayload: any = {
        item_id: numericItemId,
        user_id: currentUser.id,
        content: text.trim(),
      };
      if (parentId) {
        const numericParentId = parseInt(parentId, 10);
        if (!isNaN(numericParentId)) insertPayload.parent_id = numericParentId;
      }

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

      if (error) throw error;

      if (data) {
        const newComment = formatCommentFromDB(data as any, true);

        if (parentId) {
          setComments(comments.map(c =>
            c.id === parentId
              ? { ...c, replies: c.replies.some(r => r.id === newComment.id) ? c.replies : [...c.replies, newComment] }
              : c
          ));
        } else {
          const updatedComments = comments.some(c => c.id === newComment.id)
            ? comments
            : [...comments, newComment];
          setComments(updatedComments);
          // Bump global counter for top-level only (matches feed counter semantics).
          const store = useInitialCountsStore.getState();
          const prev = store.counts[String(itemId)]?.commentsCount ?? comments.length;
          store.setBulkCounts([
            { itemId, commentsCount: Math.max(prev + 1, updatedComments.length) },
          ]);
        }
        return newComment;
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
