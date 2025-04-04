
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "../useGlobalAuth";
import { formatCommentFromDB } from "./utils/commentFormatters";
import { useToast } from "../use-toast";
import type { User } from "./utils/userUtils";
import { useState } from "react";

export const useCommentsFetch = (itemId: string) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Fetching comments for item ${numericItemId}`);
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
        .eq('item_id', numericItemId)
        .order('created_at', { ascending: true });
      
      if (error) throw error;
      
      if (!data) return [];
      
      console.log('Comments data received:', data);
      
      // Transform data to match Comment type
      const comments = data.map(comment => 
        formatCommentFromDB(comment, comment.user_id === user?.id)
      );
      
      return comments;
    } catch (error: any) {
      console.error("Error fetching comments:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      toast({
        title: "Error",
        description: "Failed to load comments",
        variant: "destructive",
      });
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  
  // Get comments count
  const fetchCommentsCount = async (): Promise<number> => {
    if (!itemId) return 0;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      const { data, error, count } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('item_id', numericItemId);
      
      if (error) throw error;
      
      return count || 0;
    } catch (error) {
      console.error("Error fetching comments count:", error);
      return 0;
    }
  };
  
  // Fetch users who commented on the item
  const fetchCommenters = async (): Promise<User[]> => {
    if (!itemId) return [];
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      // First get the unique user IDs from comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('user_id')
        .eq('item_id', numericItemId);
      
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
    fetchCommenters,
    isLoading,
    error
  };
};
