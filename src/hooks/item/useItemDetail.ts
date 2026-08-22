
import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { withRetry } from '@/utils/connectionRetryUtils';
import { useTranslation } from 'react-i18next';
import { ITEM_PUBLIC_SELECT } from '@/services/items/publicColumns';

/**
 * Local "auth ready" signal that does NOT depend on the global auth store.
 *
 * The previous implementation gated the query on `useAuthStore.initialized`,
 * but on direct navigation to /item/:id (especially for unauthenticated
 * users arriving from external links / emails), the global initialization
 * promise could remain pending and the item page stayed stuck on a
 * skeleton forever.
 *
 * Calling `supabase.auth.getSession()` reads from localStorage in practice
 * and resolves quickly whether or not a session exists, so we can use it
 * as an independent readiness signal. We also subscribe to auth changes so
 * the query re-enables once a session is restored.
 */
function useAuthReady() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    // Hard fallback: never let the skeleton hang. If for any reason
    // getSession() doesn't resolve in time, mark ready anyway and let
    // the query fire (public reads are allowed for items).
    const fallback = setTimeout(() => {
      if (!cancelled) setReady(true);
    }, 1500);

    supabase.auth
      .getSession()
      .catch(() => null)
      .finally(() => {
        if (!cancelled) {
          clearTimeout(fallback);
          setReady(true);
        }
      });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      if (!cancelled) setReady(true);
    });

    return () => {
      cancelled = true;
      clearTimeout(fallback);
      subscription.unsubscribe();
    };
  }, []);

  return ready;
}

export function useItemDetail(id: string) {
  const { toast } = useToast();
  const { t } = useTranslation();
  const authReady = useAuthReady();

  const query = useQuery({
    queryKey: ['item', id],
    queryFn: async () => {
      try {
        const numericId = parseInt(id, 10);
        if (isNaN(numericId)) {
          const e = new Error('Invalid item ID');
          (e as any).isNotFound = true;
          throw e;
        }

        const { data, error } = await withRetry(
          async () => {
            return await supabase
              .from('items')
              .select(ITEM_PUBLIC_SELECT)
              .eq('id', numericId)
              .single();
          },
          {
            maxAttempts: 2,
            initialDelay: 500,
            onRetry: () => {},
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
          const e = new Error(error.message || 'Failed to load item');
          // PGRST116 = .single() matched 0 (or >1) rows -- the only case
          // that means "this item genuinely doesn't exist", as opposed to
          // a network blip, timeout, or other transient failure. Found
          // live: every failure here was being treated as a 404, so a
          // plain retryable connection error on an item-detail link
          // (notification/email/map click) permanently bounced the user
          // to /404 instead of showing a retry option.
          (e as any).isNotFound = (error as any).code === 'PGRST116';
          (e as any).code = (error as any).code;
          throw e;
        }

        if (!data) {
          console.error('Item not found');
          const e = new Error('Item not found');
          (e as any).isNotFound = true;
          throw e;
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
    // Only wait for the local auth-ready signal (resolves for both
    // authenticated and unauthenticated users). Do NOT gate on the global
    // auth store — direct-URL navigation must work even when no session
    // exists.
    enabled: authReady && !!id,
  });

  return {
    ...query,
    isLoading: query.isLoading || !authReady,
  };
}
