
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { formatCommentFromDB } from "../utils/commentFormatters";
import { useGlobalAuth } from "../../useGlobalAuth";
import { useCommentRetry } from "./useCommentRetry";

export const useFetchComments = (itemId: string) => {
  const { user } = useGlobalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  
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

  // Clean up previous fetch operations if component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        try {
          abortControllerRef.current.abort();
        } catch (e) {
          console.warn("[useFetchComments] Error aborting fetch:", e);
        }
      }
      cleanUp();
    };
  }, [cleanUp]);

  const fetchComments = async (): Promise<Comment[]> => {
    if (!itemId) return [];
    
    // Clean up any existing requests
    cleanUp();
    
    // Abort any in-progress requests
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.warn("[useFetchComments] Error aborting previous request:", e);
      }
    }
    
    // Create a new abort controller
    let controller: AbortController | null = null;
    try {
      controller = createAbortController();
      abortControllerRef.current = controller;
    } catch (e) {
      console.warn("[useFetchComments] AbortController not supported, continuing without it");
    }
    
    setIsLoading(true);
    setError(null);
    
    // Set a reduced timeout (5 seconds instead of 8)
    let timeoutId: number | null = null;
    
    try {
      // Parse the itemId to ensure it's a number
      const numericItemId = parseInt(itemId);
      if (isNaN(numericItemId)) {
        throw new Error(`Invalid item ID: ${itemId}`);
      }
      
      console.log(`[useFetchComments] Fetching comments for item ${numericItemId} (attempt ${getCurrentAttempts() + 1}/${maxAttempts})`);
      
      // Set up a timeout for the request - reduced to 5 seconds
      if (typeof window !== 'undefined') {
        timeoutId = window.setTimeout(() => {
          if (controller) {
            console.log(`[useFetchComments] Comments fetch timeout after 5000ms`);
            controller.abort();
          }
        }, 5000); // Reduced from 8000ms to 5000ms
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
      
      // Execute the query with a shorter timeout
      const { data, error } = await query;
      
      // Clear the timeout
      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
        timeoutId = null;
      }
      
      if (error) {
        console.error("[useFetchComments] Error in Supabase query:", error);
        throw error;
      }
      
      if (!data) {
        console.log("[useFetchComments] No comments data returned");
        return [];
      }
      
      console.log('[useFetchComments] Comments data received:', data.length, 'comments');
      resetAttempts(); // Reset counter on success
      
      // Transform data to match Comment type
      const comments = data.map(comment => 
        formatCommentFromDB(comment, comment.user_id === user?.id)
      );
      
      setIsLoading(false);
      return comments;
    } catch (error: any) {
      // Clear timeout if it exists
      if (timeoutId !== null && typeof window !== 'undefined') {
        window.clearTimeout(timeoutId);
      }
      
      // Handle aborted requests specially
      if (error.name === 'AbortError') {
        console.log('[useFetchComments] Comments fetch aborted');
        
        // Retry logic
        if (!isMaxAttemptsReached()) {
          const currentAttempt = incrementAttempts();
          const backoffDelay = 1000 * (currentAttempt + 1); // Exponential backoff
          console.log(`[useFetchComments] Retrying comments fetch in ${backoffDelay}ms (attempt ${currentAttempt + 1}/${maxAttempts})`);
          
          // Return empty for now
          setError(new Error(`Comments loading timeout. Retrying (${currentAttempt}/${maxAttempts})`));
          return [];
        } else {
          // Max attempts reached
          console.error("[useFetchComments] Max comments fetch attempts reached");
          resetAttempts(); // Reset for next time
          const timeoutError = new Error("Comments loading timed out. Please try refreshing.");
          setError(timeoutError);
          setIsLoading(false);
          return [];
        }
      }
      
      // For non-abort errors
      console.error("[useFetchComments] Error fetching comments:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsLoading(false);
      
      return [];
    }
  };

  return {
    fetchComments,
    isLoading,
    error
  };
};
