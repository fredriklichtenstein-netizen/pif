
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { formatCommentFromDB } from "../utils/commentFormatters";
import { useGlobalAuth } from "../../useGlobalAuth";
import { useCommentRetry } from "./useCommentRetry";

export const useFetchComments = (itemId: string) => {
  const { user } = useGlobalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { 
    cleanUp, 
    resetAttempts, 
    incrementAttempts, 
    isMaxAttemptsReached, 
    getCurrentAttempts,
    createAbortController, 
    setTimeout: setTimeoutFn,
    maxAttempts
  } = useCommentRetry(3);

  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    // Clean up any existing requests
    cleanUp();
    
    // Create a new abort controller if possible in this environment
    let controller: AbortController | null = null;
    try {
      controller = createAbortController();
    } catch (e) {
      console.warn("AbortController not supported in this environment, continuing without it");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Fetching comments for item ${numericItemId} (attempt ${getCurrentAttempts() + 1}/${maxAttempts})`);
      
      // Set up a timeout for the request - reduced to 8 seconds from 15 seconds
      let timeoutId: number | null = null;
      if (typeof window !== 'undefined') {
        timeoutId = window.setTimeout(() => {
          if (controller) {
            console.log(`Comments fetch timeout after 8000ms`);
            controller.abort();
          }
        }, 8000);
      }
      
      // Prepare the query
      let query = supabase
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
      
      // Add abort signal if supported
      if (controller) {
        query = query.abortSignal(controller.signal);
      }
      
      // Execute the query
      const { data, error } = await query;
      
      // Clear the timeout
      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
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
      resetAttempts(); // Reset counter on success
      
      // Transform data to match Comment type
      const comments = data.map(comment => 
        formatCommentFromDB(comment, comment.user_id === user?.id)
      );
      
      return comments;
    } catch (error: any) {
      // Handle aborted requests specially
      if (error.name === 'AbortError') {
        console.log('Comments fetch aborted');
        
        // Retry logic
        if (!isMaxAttemptsReached()) {
          const currentAttempt = incrementAttempts();
          const backoffDelay = 1000 * (currentAttempt + 1); // Exponential backoff
          console.log(`Retrying comments fetch in ${backoffDelay}ms (attempt ${currentAttempt + 1}/${maxAttempts})`);
          
          // Schedule retry after backoff delay
          if (typeof window !== 'undefined') {
            window.setTimeout(() => {
              fetchComments(); // This will reset the loading state when it eventually succeeds or fails
            }, backoffDelay);
          }
          
          // Return empty for now
          setError(new Error(`Comments loading timeout. Retrying (${currentAttempt}/${maxAttempts})`));
          return [];
        } else {
          // Max attempts reached
          console.error("Max comments fetch attempts reached");
          resetAttempts(); // Reset for next time
          const timeoutError = new Error("Comments loading timed out. Please try refreshing.");
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
      if (getCurrentAttempts() === 0 || isMaxAttemptsReached()) {
        setIsLoading(false);
      }
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
    isLoading,
    error
  };
};
