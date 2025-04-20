
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Comment } from "@/types/comment";
import { formatCommentFromDB } from "../utils/commentFormatters";
import { useGlobalAuth } from "../../useGlobalAuth";
import { useCommentRetry } from "./useCommentRetry";
import { withRetry, fetchWithTimeout } from "@/utils/connectionRetryUtils";

const FALLBACK_COMMENTS: Comment[] = [
  {
    id: "fallback-1",
    text: "Welcome to our circular economy community! Share items you no longer need, and find treasures others are sharing.",
    author: {
      name: "PiF Team",
      avatar: "https://ui-avatars.com/api/?name=PiF&background=random",
      id: "fallback-author-1"
    },
    likes: 5,
    isLiked: false,
    replies: [],
    createdAt: new Date(),
    isOwn: false
  }
];

export const useFetchComments = (itemId: string) => {
  const { user } = useGlobalAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [useFallbackMode, setUseFallbackMode] = useState(false);
  
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
    
    cleanUp();
    
    if (abortControllerRef.current) {
      try {
        abortControllerRef.current.abort();
      } catch (e) {
        console.warn("[useFetchComments] Error aborting previous request:", e);
      }
    }
    
    let controller: AbortController | null = null;
    try {
      controller = createAbortController();
      abortControllerRef.current = controller;
    } catch (e) {
      console.warn("[useFetchComments] AbortController not supported, continuing without it");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Parse itemId as number, but handle it more gracefully
      let numericItemId: number;
      
      if (typeof itemId === 'number') {
        numericItemId = itemId;
      } else if (typeof itemId === 'string') {
        numericItemId = parseInt(itemId, 10);
        if (isNaN(numericItemId)) {
          console.warn(`[useFetchComments] Invalid item ID: ${itemId}, using fallback`);
          setUseFallbackMode(true);
          setIsLoading(false);
          return [...FALLBACK_COMMENTS];
        }
      } else {
        console.warn(`[useFetchComments] Unsupported item ID type: ${typeof itemId}, using fallback`);
        setUseFallbackMode(true);
        setIsLoading(false);
        return [...FALLBACK_COMMENTS];
      }
      
      console.log(`[useFetchComments] Fetching comments for item ${numericItemId} (attempt ${getCurrentAttempts() + 1}/${maxAttempts})`);
      
      const result = await withRetry<Comment[]>(
        async () => {
          if (useFallbackMode) {
            console.log("[useFetchComments] Using fallback comments data");
            return Promise.resolve([...FALLBACK_COMMENTS]);
          }
          
          const signal = controller?.signal;
          
          // Fixed: Properly handling the Supabase query
          return new Promise<Comment[]>(async (resolve, reject) => {
            try {
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
              
              if (signal) {
                query = query.abortSignal(signal);
              }
              
              const timeoutPromise = new Promise<void>((_, timeoutReject) => {
                setTimeout(() => timeoutReject(new Error('Request timed out')), 5000);
              });

              // Race between the query and the timeout
              try {
                const response = await Promise.race([
                  query,
                  timeoutPromise.then(() => { throw new Error('Request timed out'); })
                ]);
                
                if ('error' in response && response.error) {
                  console.error("[useFetchComments] Error in Supabase query:", response.error);
                  reject(response.error);
                  return;
                }
                
                if ('data' in response && response.data) {
                  console.log('[useFetchComments] Comments data received:', response.data.length, 'comments');
                  
                  const formattedComments = response.data.map(comment => 
                    formatCommentFromDB(comment, comment.user_id === user?.id)
                  );
                  
                  resolve(formattedComments);
                } else {
                  console.log("[useFetchComments] No comments data returned");
                  resolve([]);
                }
              } catch (error) {
                reject(error);
              }
            } catch (error) {
              reject(error);
            }
          });
        },
        {
          maxAttempts: 2,
          initialDelay: 800,
          maxDelay: 2000,
          backoffFactor: 1.5,
          onRetry: (attempt, delay) => {
            console.log(`[useFetchComments] Retry attempt ${attempt} after ${delay}ms delay`);
          },
          onFail: () => {
            console.log("[useFetchComments] All fetch attempts failed, switching to fallback mode");
            setUseFallbackMode(true);
          }
        }
      );
      
      resetAttempts();
      setIsLoading(false);
      return result;
    } catch (error: any) {
      const isAbortError = error.name === 'AbortError' || 
                           error.message?.includes('aborted') || 
                           error.message?.includes('signal');
                           
      if (isAbortError) {
        console.log('[useFetchComments] Comments fetch aborted');
        
        if (isMaxAttemptsReached()) {
          console.log("[useFetchComments] Max retries reached, switching to fallback mode");
          setUseFallbackMode(true);
          resetAttempts();
          setIsLoading(false);
          return [...FALLBACK_COMMENTS];
        }
        
        // Don't retry on abort, just switch to fallback immediately for better UX
        setUseFallbackMode(true);
        resetAttempts();
        setIsLoading(false);
        return [...FALLBACK_COMMENTS];
      }
      
      console.error("[useFetchComments] Error fetching comments:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsLoading(false);
      
      if (isMaxAttemptsReached()) {
        setUseFallbackMode(true);
        return [...FALLBACK_COMMENTS];
      }
      
      return [];
    }
  };

  return {
    fetchComments,
    isLoading,
    error,
    useFallbackMode
  };
};
