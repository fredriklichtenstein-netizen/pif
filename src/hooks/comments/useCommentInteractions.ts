
import { useState } from "react";
import { Comment } from "@/types/comment";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export const useCommentInteractions = (
  comments: Comment[],
  setComments: (comments: Comment[]) => void,
  currentUser?: { id?: string; name?: string; avatar?: string; }
) => {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  const handleLikeComment = (commentId: string) => {
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const liked = !comment.isLiked;
        const newLikes = liked ? comment.likes + 1 : Math.max(0, comment.likes - 1);
        return { ...comment, isLiked: liked, likes: newLikes };
      }
      return comment;
    });
    setComments(updatedComments);
  };

  const formatUserName = (fullName: string): string => {
    const parts = fullName.split(' ');
    if (parts.length > 1) return `${parts[0]} ${parts[parts.length - 1].charAt(0)}`;
    return fullName || 'User';
  };

  const handleReplyToComment = (commentId: string, text: string) => {
    if (!text.trim() || !currentUser) return;
    const updatedComments = comments.map(comment => {
      if (comment.id === commentId) {
        const newId = Date.now().toString();
        const displayName = currentUser.name ? formatUserName(currentUser.name) : 'User';
        const newReply: Comment = {
          id: newId, text,
          author: { id: currentUser.id || '', name: displayName, avatar: currentUser.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random` },
          likes: 0, isLiked: false, replies: [], createdAt: new Date(), isOwn: true
        };
        return { ...comment, replies: [...comment.replies, newReply] };
      }
      return comment;
    });
    setComments(updatedComments);
  };

  const handleReportComment = (commentId: string) => {
    toast({
      title: t('interactions.comment_reported'),
      description: t('interactions.comment_reported_description')
    });
  };

  return { handleLikeComment, handleReplyToComment, handleReportComment };
};
