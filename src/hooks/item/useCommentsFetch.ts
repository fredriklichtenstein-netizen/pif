
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { useGlobalAuth } from "../useGlobalAuth";
import { formatCommentFromDB } from "./utils/commentFormatters";
import { useToast } from "../use-toast";
import type { User } from "./utils/userUtils";
import { useState, useRef, useCallback } from "react";

export const useCommentsFetch = (itemId: string) => {
  const { user } = useGlobalAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortController = useRef<AbortController | null>(null);
  const fetchAttempts = useRef<number>(0);
  const maxFetchAttempts = 3;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function to handle aborting requests and clearing timeouts
  const cleanUp = useCallback(() => {
    if (abortController.current) {
      try {
        abortController.current.abort();
      } catch (e) {
        console.log("Error aborting fetch:", e);
      }
      abortController.current = null;
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    // Clean up any existing requests
    cleanUp();
    
    // Create a new abort controller
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
      
      // Set up a timeout for the request - 15 seconds is plenty
      timeoutRef.current = setTimeout(() => {
        if (abortController.current) {
          console.log(`Comments fetch timeout after 15000ms`);
          abortController.current.abort();
        }
      }, 15000);
      
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
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
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
          const backoffDelay = 2000; // Fixed 2-second delay between retries
          console.log(`Retrying comments fetch in ${backoffDelay}ms (attempt ${fetchAttempts.current + 1}/${maxFetchAttempts})`);
          
          // Schedule retry after backoff delay
          setTimeout(() => {
            fetchComments(); // This will reset the loading state when it eventually succeeds or fails
          }, backoffDelay);
          
          // Return empty for now
          setError(new Error(`Comments loading timeout. Retrying (${fetchAttempts.current}/${maxFetchAttempts})`));
          return [];
        } else {
          // Max attempts reached
          console.error("Max comments fetch attempts reached");
          fetchAttempts.current = 0; // Reset for next time
          const timeoutError = new Error("Comments loading timed out after several attempts. Please try refreshing.");
          setError(timeoutError);
          setIsLoading(false);
          return [];
        }
      }
      
      // For non-abort errors
      console.error("Error fetching comments:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsLoading(false);
      
      return [];
    } finally {
      // Only clear loading if we're not in a retry situation
      if (fetchAttempts.current === 0 || fetchAttempts.current >= maxFetchAttempts) {
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
        avatar: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.first_name || 'U')}&background=random`
      }));
    } catch (error) {
      console.error("Error fetching commenters:", error);
      return [];
    }
  };

  // Clean up when the component unmounts
  useEffect(() => {
    return () => {
      cleanUp();
    };
  }, [cleanUp]);

  return {
    fetchComments,
    fetchCommentsCount,
    fetchCommenters,
    isLoading,
    error
  };
};
