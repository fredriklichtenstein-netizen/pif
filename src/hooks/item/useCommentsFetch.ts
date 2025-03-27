
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "../useGlobalAuth";
import { formatCommentFromDB } from "./utils/commentFormatters";
import { useToast } from "../use-toast";
import type { User } from "./utils/userUtils";

export const useCommentsFetch = (itemId: string) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();

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
      return data.map(comment => 
        formatCommentFromDB(comment, comment.user_id === user?.id)
      );
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
    fetchCommentsCount,
    fetchCommenters
  };
};
