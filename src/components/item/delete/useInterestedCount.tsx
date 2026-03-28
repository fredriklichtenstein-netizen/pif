import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  useEffect(() => {
    let isMounted = true;
    
    if (isOpen && !hasLoadedOnce) {
      setIsLoadingCount(true);
      fetchInterestedCount().finally(() => {
        if (isMounted) setHasLoadedOnce(true);
      });
    }
    
    if (!isOpen) setHasLoadedOnce(false);
    
    return () => { isMounted = false; };
  }, [isOpen]);
  
  const fetchInterestedCount = async () => {
    setCountError(null);
    
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);
      
      let count = 0;
      
      if (checkInterestedUsers) {
        count = await checkInterestedUsers();
      } else {
        const numericId = typeof id === 'string' ? parseInt(id, 10) : id;
        const { count: dbCount, error } = await supabase
          .from('interests')
          .select('*', { count: 'exact', head: true })
          .eq('item_id', numericId)
          .abortSignal(controller.signal);
          
        if (error) {
          if (error.message.includes('aborted')) throw new Error('Request timed out');
          throw error;
        }
        count = dbCount || 0;
      }
      
      clearTimeout(timeoutId);
      setInterestedCount(count);
      setIsLoadingCount(false);
      return count;
    } catch (error: any) {
      console.error('Error fetching interested count:', error);
      setCountError(error as Error);
      
      if (error.message === 'Request timed out' || error.name === 'AbortError') {
        toast({
          title: t('interactions.request_timed_out'),
          description: t('interactions.check_interested_timeout_description'),
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
