
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withRetry } from '@/utils/connectionRetryUtils';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/hooks/auth/authStore';

export function useItemDetail(id: string) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const authInitialized = useAuthStore((s) => s.initialized);


  const query = useQuery({
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
                profiles:user_id (
                  id,
                  first_name,
                  last_name,
                  avatar_url
                )
              `)
              .eq('id', numericId)
              .single();
          },
          {
            maxAttempts: 2,
            initialDelay: 500,
            onRetry: (attempt) => {
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
          console.error('Supabase error fetching item:', JSON.stringify(error));
          throw error;
        }
        
        if (!data) {
          console.error('Item not found');
          throw new Error('Item not found');
        }
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
    staleTime: 30000,
    // Wait for auth initialization before issuing the query. Without this,
    // direct navigation can fire the request before the Supabase client has
    // restored its session, which sometimes leaves the request hanging and
    // the page stuck on the loading skeleton.
    enabled: authInitialized && !!id,
  });

  // Treat the query as "loading" while auth is still initializing so the
  // page keeps showing the skeleton instead of falling through to an
  // undefined-displayItem render path.
  return {
    ...query,
    isLoading: query.isLoading || !authInitialized,
  };
}
