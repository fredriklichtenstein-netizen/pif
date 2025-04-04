
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
    setTimeout,
    maxAttempts
  } = useCommentRetry(3);

  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    // Clean up any existing requests
    cleanUp();
    
    // Create a new abort controller
    const controller = createAbortController();
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`Fetching comments for item ${numericItemId} (attempt ${getCurrentAttempts() + 1}/${maxAttempts})`);
      
      // Set up a timeout for the request - 15 seconds is plenty
      setTimeout(() => {
        if (controller) {
          console.log(`Comments fetch timeout after 15000ms`);
          controller.abort();
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
        .abortSignal(controller.signal);
      
      // Clear the timeout since the request completed
      cleanUp();
      
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
        
        // Retry with exponential backoff, but only up to max attempts
        if (!isMaxAttemptsReached()) {
          const currentAttempt = incrementAttempts();
          const backoffDelay = 2000; // Fixed 2-second delay between retries
          console.log(`Retrying comments fetch in ${backoffDelay}ms (attempt ${currentAttempt + 1}/${maxAttempts})`);
          
          // Schedule retry after backoff delay
          setTimeout(() => {
            fetchComments(); // This will reset the loading state when it eventually succeeds or fails
          }, backoffDelay);
          
          // Return empty for now
          setError(new Error(`Comments loading timeout. Retrying (${currentAttempt}/${maxAttempts})`));
          return [];
        } else {
          // Max attempts reached
          console.error("Max comments fetch attempts reached");
          resetAttempts(); // Reset for next time
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
