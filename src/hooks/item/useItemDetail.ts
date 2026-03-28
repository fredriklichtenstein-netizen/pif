
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withRetry } from '@/utils/connectionRetryUtils';
import { useTranslation } from 'react-i18next';

export function useItemDetail(id: string) {
  const { toast } = useToast();
  const { t } = useTranslation();
  
  return useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          throw new Error('Invalid item ID');
        }
        
        const { data, error } = await withRetry(
          async () => {
            return await supabase
              .from('items')
              .select(`
                *,
                user_id,
                profiles:user_id (
                  id,
                  first_name,
                  last_name,
                  avatar_url
                ),
                likes:likes(user_id),
                interests:interests(user_id),
                bookmarks:bookmarks(user_id)
              `)
              .eq('id', numericId)
              .single();
          },
          {
            maxAttempts: 2,
            initialDelay: 500,
            onRetry: (attempt) => {
              console.log(`Retrying item detail fetch, attempt ${attempt}`);
            },
            onFail: () => {
              toast({
                title: t('interactions.connection_issue'),
                description: t('interactions.connection_issue_description'),
                variant: "destructive"
              });
            }
          }
        );

        if (error) {
          console.error('Error fetching item detail:', error);
          throw error;
        }
        
        if (!data) {
          console.error('Item not found');
          throw new Error('Item not found');
        }

        console.log('Item detail loaded:', data);
        return data;
      } catch (err) {
        console.error('Error in useItemDetail:', err);
        throw err;
      }
    },
    retry: (failureCount, error) => {
      if (error instanceof Error) {
        const errorMessage = error.message.toLowerCase();
        if (errorMessage.includes('network') || errorMessage.includes('timeout') || errorMessage.includes('connection')) {
          return failureCount < 2;
        }
      }
      return false;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * (2 ** attemptIndex), 10000),
    staleTime: 30000
  });
}
