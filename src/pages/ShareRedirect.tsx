
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { withRetry } from '@/utils/connectionRetryUtils';
import { useTranslation } from 'react-i18next';

const validatedItemCache: Record<string, { valid: boolean; timestamp: number }> = {};
const CACHE_EXPIRY = 1000 * 60 * 10;

export default function ShareRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [isValidating, setIsValidating] = useState(true);
  const [itemExists, setItemExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const validateItem = async (normalizedId: string) => {
    setIsValidating(true);
    setIsRetrying(retryCount > 0);
    
    try {
      const now = Date.now();
      const cachedResult = validatedItemCache[normalizedId];
      if (cachedResult && (now - cachedResult.timestamp) < CACHE_EXPIRY) {
        if (cachedResult.valid) {
          setItemExists(true);
          setTimeout(() => {
            navigate(`/item/${normalizedId}`, { 
              replace: true,
              state: { fromShare: true, timestamp: Date.now() }
            });
          }, 100);
        } else {
          setItemExists(false);
          setError('Item not found (cached result)');
        }
        setIsValidating(false);
        return;
      }
      
      const numericId = parseInt(normalizedId, 10);
      
      if (isNaN(numericId)) {
        setError('Invalid item ID format');
        setItemExists(false);
        setIsValidating(false);
        validatedItemCache[normalizedId] = { valid: false, timestamp: now };
        return;
      }
      
      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('items')
            .select('id')
            .eq('id', numericId)
            .maybeSingle();
          if (error) throw error;
          return { data, error };
        },
        {
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 3000,
          backoffFactor: 1.5,
          onRetry: (attempt, delay) => {
          }
        }
      );
      
      const isValid = !!result.data;
      validatedItemCache[normalizedId] = { valid: isValid, timestamp: now };
      
      if (!isValid) {
        setError('Item not found');
        setItemExists(false);
      } else {
        setItemExists(true);
        setTimeout(() => {
          navigate(`/item/${numericId}`, { 
            replace: true,
            state: { fromShare: true, timestamp: Date.now() }
          });
        }, 100);
      }
    } catch (err) {
      console.error('ShareRedirect: Error during validation:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setItemExists(false);
    } finally {
      setIsValidating(false);
      setIsRetrying(false);
    }
  };
  
  const handleRetry = () => {
    if (!id || isValidating) return;
    setRetryCount(prev => prev + 1);
    const normalizedId = id.trim();
    validateItem(normalizedId);
  };
  
  useEffect(() => {
    if (!id) {
      setError('Missing item ID');
      setIsValidating(false);
      setItemExists(false);
      return;
    }
    const normalizedId = id.trim();
    if (!normalizedId) {
      setError('Invalid item ID format');
      setIsValidating(false);
      setItemExists(false);
      return;
    }
    validateItem(normalizedId);
  }, [id, navigate]);
  
  useEffect(() => {
    if (!isValidating && itemExists === false) {
      toast({
        title: t('share.item_not_found'),
        description: error || '',
        variant: "destructive",
      });
      setTimeout(() => {
        navigate('/404', { 
          replace: true, 
          state: { from: 'share', itemId: id, error }
        });
      }, 300);
    }
  }, [isValidating, itemExists, id, navigate, error, toast, t]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      {isValidating ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground mb-2">{t('share.validating_item')}</p>
          <p className="text-sm text-muted-foreground mb-4">{t('share.please_wait')}</p>
        </>
      ) : itemExists === false ? (
        <>
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-lg text-muted-foreground mb-2">{t('share.item_not_found')}</p>
          <p className="text-sm text-muted-foreground mb-6">
            {t('share.item_removed_or_invalid')}
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? t('share.retrying') : t('common.try_again')}
            </Button>
            <Button 
              onClick={() => navigate('/feed', { replace: true })}
              variant="default"
            >
              {t('share.browse_feed')}
            </Button>
          </div>
        </>
      ) : (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-muted-foreground">{t('share.redirecting')}</p>
        </>
      )}
    </div>
  );
}
