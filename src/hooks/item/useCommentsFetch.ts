
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "../useGlobalAuth";
import { formatCommentFromDB } from "./utils/commentFormatters";
import { useToast } from "../use-toast";
import type { User } from "./utils/userUtils";
import { useState, useRef } from "react";

export const useCommentsFetch = (itemId: string) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const fetchAttempts = useRef<number>(0);
  const maxFetchAttempts = 3;

  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    // Abort any in-flight request
    if (abortController.current) {
      abortController.current.abort();
    }
    abortController.current = new AbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Fetching comments for item ${numericItemId} (attempt ${fetchAttempts.current + 1}/${maxFetchAttempts})`);
      
      // Set up a timeout for the request
      const timeoutMs = 8000 + (fetchAttempts.current * 2000); // Increase timeout with each retry
      const timeoutId = setTimeout(() => {
        if (abortController.current) {
          console.log(`Comments fetch timeout after ${timeoutMs}ms`);
          abortController.current.abort();
        }
      }, timeoutMs);
      
      // Perform the request with the abort signal
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
        .order('created_at', { ascending: true })
        .abortSignal(abortController.current.signal);
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);
      
      if (error) {
        console.error("Error in Supabase query:", error);
        throw error;
      }
      
      if (!data) {
        console.log("No comments data returned");
        return [];
      }
      
      console.log('Comments data received:', data);
      fetchAttempts.current = 0; // Reset counter on success
      
      // Transform data to match Comment type
      const comments = data.map(comment => 
        formatCommentFromDB(comment, comment.user_id === user?.id)
      );
      
      return comments;
    } catch (error: any) {
      // Handle aborted requests specially
      if (error.name === 'AbortError') {
        console.log('Comments fetch aborted');
        
        // Retry with exponential backoff, but only up to max attempts
        if (fetchAttempts.current < maxFetchAttempts - 1) {
          fetchAttempts.current++;
          const backoffDelay = Math.min(1000 * Math.pow(2, fetchAttempts.current), 10000);
          console.log(`Retrying comments fetch in ${backoffDelay}ms (attempt ${fetchAttempts.current + 1}/${maxFetchAttempts})`);
          
          // Don't set loading to false yet, we're retrying
          setTimeout(() => {
            fetchComments(); // This will reset the loading state when it eventually succeeds or fails
          }, backoffDelay);
          
          // Return empty for now
          return [];
        } else {
          // Max attempts reached
          console.error("Max comments fetch attempts reached");
          fetchAttempts.current = 0; // Reset for next time
          const timeoutError = new Error("Comments loading timed out. Please try refreshing.");
          setError(timeoutError);
          return [];
        }
      }
      
      // For non-abort errors
      console.error("Error fetching comments:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      
      toast({
        title: "Error",
        description: "Failed to load comments. Please try again.",
        variant: "destructive",
      });
      return [];
    } finally {
      // Only clear loading if not retrying
      if (error?.name !== 'AbortError' || fetchAttempts.current >= maxFetchAttempts - 1) {
        setIsLoading(false);
      }
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
      
      const { count, error } = await supabase
        .from('comments')
        .select('id', { count: 'exact', head: true })
        .eq('item_id', numericItemId);
      
      if (error) {
        console.error("Error fetching comments count:", error);
        throw error;
      }
      
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
