
import { useAuth } from "@/hooks/useAuth";
import type { Comment } from "@/types/comment";
import { supabase } from "@/integrations/supabase/client";

export function useCommentActions(itemId: string, comments: Comment[], setComments: (comments: Comment[]) => void, currentUser: { name: string, avatar: string, id?: string }) {
  const { session } = useAuth();

  const handleAddComment = async (text: string) => {
    if (!session?.user) return;
    
    try {
      const numericId = parseInt(itemId, 10);
      if (isNaN(numericId)) return;
      
      // Add comment to database
      const { data, error } = await supabase
        .from('comments')
        .insert([
          { 
            content: text,
            item_id: numericId,
            user_id: session.user.id
          }
        ])
        .select(`
          id,
          content,
          created_at,
          user_id,
          profiles:user_id (
            first_name,
            last_name,
            avatar_url
          )
        `)
        .single();
      
      if (error) throw error;
      
      // Create comment object
      const newComment: Comment = {
        id: data.id.toString(),
        text: data.content,
        author: {
          id: data.user_id,
          name: currentUser.name,
          avatar: currentUser.avatar
        },
        likes: 0,
        isLiked: false,
        replies: [],
        createdAt: new Date(data.created_at)
      };
      
      // Add to local state
      setComments([newComment, ...comments]);
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  const handleLikeComment = (commentId: string) => {
    // We'll implement comment likes later
    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1,
          isLiked: !comment.isLiked,
        };
      }
      return comment;
    }));
  };

  const handleEditComment = async (commentId: string, newText: string) => {
    if (!session?.user) return;
    
    try {
      // Update comment in database
      const { error } = await supabase
        .from('comments')
        .update({ content: newText })
        .eq('id', parseInt(commentId, 10))
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Update in local state
      setComments(comments.map(comment => {
        if (comment.id === commentId) {
          return { ...comment, text: newText };
        }
        return comment;
      }));
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!session?.user) return;
    
    try {
      // Delete from database
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', parseInt(commentId, 10))
        .eq('user_id', session.user.id);
      
      if (error) throw error;
      
      // Remove from local state
      setComments(comments.filter(comment => comment.id !== commentId));
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleReplyToComment = (commentId: string, text: string) => {
    // We'll implement nested comments later
    const reply = {
      id: Date.now().toString(),
      text,
      author: {
        name: currentUser.name,
        avatar: currentUser.avatar,
        id: currentUser.id
      },
      likes: 0,
      isLiked: false,
      replies: [],
      createdAt: new Date(),
    };

    setComments(comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          replies: [reply, ...comment.replies],
        };
      }
      return comment;
    }));
  };

  const handleReportComment = (commentId: string) => {
    // This is handled by the toast in the CommentCard component
  };

  return {
    handleAddComment,
    handleLikeComment,
    handleEditComment,
    handleDeleteComment,
    handleReplyToComment,
    handleReportComment
  };
}
