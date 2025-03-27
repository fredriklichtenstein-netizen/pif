
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "../use-toast";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "../useGlobalAuth";
import { useAuthCheck } from "./utils/authCheck";
import { User } from "./useLikes";

export const useComments = (itemId: string) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const { checkAuth } = useAuthCheck();
  
  // Fetch comments for an item
  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    try {
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
        .eq('item_id', parseInt(itemId))
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!data) return [];
      
      // Transform data to match Comment type
      return data.map(comment => ({
        id: comment.id.toString(),
        text: comment.content,
        createdAt: new Date(comment.created_at),
        author: {
          id: comment.profiles.id,
          name: `${comment.profiles.first_name || ''} ${comment.profiles.last_name || ''}`.trim() || 'User',
          avatar: comment.profiles.avatar_url
        },
        isLiked: false,
        likes: 0,
        replies: [],
        isOwn: comment.user_id === user?.id
      }));
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
      return [];
    }
  };
  
  // Add a comment to an item
  const addComment = async (content: string): Promise<Comment | null> => {
    if (!itemId || !content.trim()) return null;
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuth("add a comment");
    if (!isAuthenticated) return null;
    
    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          item_id: parseInt(itemId),
          user_id: user?.id,
          content: content.trim()
        })
        .select('id, created_at')
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      // Create a new comment object
      const newComment: Comment = {
        id: data.id.toString(),
        text: content.trim(),
        createdAt: new Date(data.created_at),
        author: {
          id: user!.id,
          name: user?.id === user!.id ? 'You' : 'User', // This is a placeholder, should be replaced with actual user name
          avatar: null // This is a placeholder, should be replaced with actual user avatar
        },
        isLiked: false,
        likes: 0,
        replies: [],
        isOwn: true
      };
      
      return newComment;
    } catch (error: any) {
      console.error("Error adding comment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return null;
    }
  };
  
  // Delete a comment
  const deleteComment = async (commentId: string): Promise<boolean> => {
    if (!commentId) return false;
    
    // Check if user is authenticated
    const isAuthenticated = await checkAuth("delete a comment");
    if (!isAuthenticated) return false;
    
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', parseInt(commentId))
        .eq('user_id', user?.id);
      
      if (error) throw error;
      
      return true;
    } catch (error: any) {
      console.error("Error deleting comment:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
  };
  
  // Get comments count
  const fetchCommentsCount = async (): Promise<number> => {
    if (!itemId) return 0;
    
    try {
      const { data, error } = await supabase
        .from('item_interactions')
        .select('comments_count')
        .eq('item_id', parseInt(itemId))
        .single();
      
      if (error) throw error;
      
      return data?.comments_count || 0;
    } catch (error) {
      console.error("Error fetching comments count:", error);
      return 0;
    }
  };
  
  // Fetch users who commented on the item
  const fetchCommenters = async (): Promise<User[]> => {
    if (!itemId) return [];
    
    try {
      // First get the unique user IDs from comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('item_id', parseInt(itemId));
      
      if (commentsError) throw commentsError;
      if (!commentsData || commentsData.length === 0) return [];
      
      // Filter out duplicate user IDs
      const uniqueUserIds = Array.from(new Set(commentsData.map(comment => comment.user_id)));
      
      // Then fetch the profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, avatar_url')
        .in('id', uniqueUserIds);
      
      if (profilesError) throw profilesError;
      if (!profilesData) return [];
      
      // Map profiles to User objects
      return profilesData.map(profile => ({
        id: profile.id,
        name: `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'User',
        avatar: profile.avatar_url
      }));
    } catch (error) {
      console.error("Error fetching commenters:", error);
      return [];
    }
  };
  
  return {
    fetchComments,
    addComment,
    deleteComment,
    fetchCommentsCount,
    fetchCommenters
  };
};
