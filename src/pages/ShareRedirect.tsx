
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { withRetry } from '@/utils/connectionRetryUtils';

// Cache for validated items to avoid duplicate lookups
const validatedItemCache: Record<string, { valid: boolean; timestamp: number }> = {};
const CACHE_EXPIRY = 1000 * 60 * 10; // 10 minutes

export default function ShareRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isValidating, setIsValidating] = useState(true);
  const [itemExists, setItemExists] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const validateItem = async (normalizedId: string) => {
    setIsValidating(true);
    setIsRetrying(retryCount > 0);
    
    try {
      console.log(`ShareRedirect: Validating item ${normalizedId} (attempt ${retryCount + 1})`);
      
      // Check cache first
      const now = Date.now();
      const cachedResult = validatedItemCache[normalizedId];
      if (cachedResult && (now - cachedResult.timestamp) < CACHE_EXPIRY) {
        console.log(`ShareRedirect: Using cached validation for item ${normalizedId}: ${cachedResult.valid}`);
        
        if (cachedResult.valid) {
          setItemExists(true);
          
          // Add a short delay before redirecting to ensure state is properly passed
          setTimeout(() => {
            navigate(`/item/${normalizedId}`, { 
              replace: true,
              state: { 
                fromShare: true,
                timestamp: Date.now() 
              }
            });
          }, 100);
        } else {
          setItemExists(false);
          setError('Item not found (cached result)');
        }
        
        setIsValidating(false);
        return;
      }
      
      // Convert the ID to a number since the database expects a numeric ID
      const numericId = parseInt(normalizedId, 10);
      
      if (isNaN(numericId)) {
        console.error('ShareRedirect: Item ID is not a number:', normalizedId);
        setError('Invalid item ID format - not a number');
        setItemExists(false);
        setIsValidating(false);
        
        // Cache the invalid result
        validatedItemCache[normalizedId] = { valid: false, timestamp: now };
        return;
      }
      
      console.log(`ShareRedirect: Validating if item ${numericId} exists`);
      
      // Use retry mechanism for database query
      const result = await withRetry(
        async () => {
          const { data, error } = await supabase
            .from('items')
            .select('id')
            .eq('id', numericId)
            .maybeSingle();
            
          if (error) {
            console.error('ShareRedirect: Error checking item existence:', error);
            throw error;
          }
          
          return { data, error };
        },
        {
          maxAttempts: 3,
          initialDelay: 500,
          maxDelay: 3000,
          backoffFactor: 1.5,
          onRetry: (attempt, delay) => {
            console.log(`ShareRedirect: Retrying database query (attempt ${attempt}) after ${delay}ms`);
          }
        }
      );
      
      // Store result in cache
      const isValid = !!result.data;
      validatedItemCache[normalizedId] = { valid: isValid, timestamp: now };
      
      if (!isValid) {
        console.error(`ShareRedirect: Item with ID ${numericId} not found`);
        setError('Item not found');
        setItemExists(false);
      } else {
        console.log(`ShareRedirect: Item ${numericId} exists, redirecting`);
        setItemExists(true);
        
        // Add a short delay before redirecting to ensure state is properly passed
        setTimeout(() => {
          navigate(`/item/${numericId}`, { 
            replace: true,
            state: { 
              fromShare: true,
              timestamp: Date.now() 
            }
          });
        }, 100);
      }
    } catch (err) {
      console.error('ShareRedirect: Error during validation:', err);
      setError(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
      setItemExists(false);
      
      // Don't cache errors that might be temporary
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
    console.log('ShareRedirect: Processing shared link with ID:', id);
    
    // Validate the ID parameter
    if (!id) {
      console.error('ShareRedirect: Missing item ID, redirecting to 404');
      setError('Missing item ID');
      setIsValidating(false);
      setItemExists(false);
      return;
    }
    
    // Normalized ID (ensure it's a valid format)
    const normalizedId = id.trim();
    
    if (!normalizedId) {
      console.error('ShareRedirect: Invalid item ID format, redirecting to 404');
      setError('Invalid item ID format');
      setIsValidating(false);
      setItemExists(false);
      return;
    }

    validateItem(normalizedId);
  }, [id, navigate]);
  
  // If validation is complete and item doesn't exist, redirect to 404
  useEffect(() => {
    if (!isValidating && itemExists === false) {
      toast({
        title: "Item not found",
        description: `The shared item couldn't be found: ${error}`,
        variant: "destructive",
      });
      
      // Add a short delay before redirecting to ensure the toast is displayed
      setTimeout(() => {
        // Redirect to 404 with context
        navigate('/404', { 
          replace: true, 
          state: { 
            from: 'share',
            itemId: id,
            error: error
          } 
        });
      }, 300);
    }
  }, [isValidating, itemExists, id, navigate, error, toast]);
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-50">
      {isValidating ? (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600 mb-2">Validating item...</p>
          <p className="text-sm text-gray-500 mb-4">Please wait while we locate the shared item.</p>
        </>
      ) : itemExists === false ? (
        <>
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-lg text-gray-600 mb-2">Item not found.</p>
          <p className="text-sm text-gray-500 mb-6">
            The item may have been removed or the link is invalid.
          </p>
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              className="flex items-center gap-2"
              onClick={handleRetry}
              disabled={isRetrying}
            >
              <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
              {isRetrying ? 'Retrying...' : 'Try again'}
            </Button>
            <Button 
              onClick={() => navigate('/feed', { replace: true })}
              variant="default"
            >
              Browse Feed
            </Button>
          </div>
        </>
      ) : (
        <>
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-lg text-gray-600">Redirecting to item...</p>
        </>
      )}
    </div>
  );
}
