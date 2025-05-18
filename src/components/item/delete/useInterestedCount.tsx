import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Custom hook to fetch the count of users interested in an item
 * with optimizations to run the check in the background
 */
export function useInterestedCount(
  id: string | number,
  isOpen: boolean,
  checkInterestedUsers?: () => Promise<number>
) {
  const [isLoadingCount, setIsLoadingCount] = useState(false);
  const [interestedCount, setInterestedCount] = useState(0);
  const [countError, setCountError] = useState<Error | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const { toast } = useToast();

  // Fetch interested count when dialog opens, but don't block UI
  useEffect(() => {
    let isMounted = true;
    
    if (isOpen && !hasLoadedOnce) {
      // Set loading state but don't wait for result before showing dialog
      setIsLoadingCount(true);
      
      // Start the check in the background
      fetchInterestedCount().finally(() => {
        if (isMounted) {
          setHasLoadedOnce(true);
        }
      });
    }
    
    // Reset states if dialog is closed
    if (!isOpen) {
      setHasLoadedOnce(false);
    }
    
    // Cleanup function to prevent memory leaks and stale state
    return () => {
      isMounted = false;
    };
  }, [isOpen]);
  
  // Function to fetch interested count
  const fetchInterestedCount = async () => {
    setCountError(null);
    
    try {
      // Use AbortController to handle timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
      
      let count = 0;
      
      if (checkInterestedUsers) {
        // Use the passed function if available
        count = await checkInterestedUsers();
      } else {
        // Otherwise do the direct DB query with abort signal
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        const { count: dbCount, error } = await supabase
          .from('interests')
          .select('*', { count: 'exact', head: true })
          .eq('item_id', numericId)
          .abortSignal(controller.signal);
          
        if (error) {
          if (error.message.includes('aborted')) {
            throw new Error('Request timed out');
          }
          throw error;
        }
        
        count = dbCount || 0;
      }
      
      // Clear the timeout since we got a response
      clearTimeout(timeoutId);
      
      setInterestedCount(count);
      setIsLoadingCount(false);
      return count;
    } catch (error: any) {
      console.error('Error fetching interested count:', error);
      setCountError(error as Error);
      
      // Only show a toast for timeout errors
      if (error.message === 'Request timed out' || error.name === 'AbortError') {
        toast({
          title: "Request timed out",
          description: "Could not check who's interested in this item",
          variant: "destructive",
        });
      }
      
      setIsLoadingCount(false);
      return 0;
    }
  };
  
  return {
    isLoadingCount,
    interestedCount,
    countError,
    fetchInterestedCount
  };
}
