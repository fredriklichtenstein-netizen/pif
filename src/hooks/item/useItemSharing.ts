
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useShare } from '@/hooks/useShare';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';
import { withRetry, isNetworkError, fetchWithTimeout } from '@/utils/connectionRetryUtils';

// Local validation cache to avoid redundant validations
const validatedItemIds: Record<string, { timestamp: number, valid: boolean }> = {};
const CACHE_EXPIRY_MS = 1000 * 60 * 10; // 10 minutes

/**
 * Hook for sharing item content with enhanced error handling, validation, and retry logic.
 */
export const useItemSharing = (itemId: string) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { shareContent, isShareSupported } = useShare();
  const { session } = useGlobalAuth();

  /**
   * Validates that an item exists before sharing it, with retry logic
   */
  const validateItem = useCallback(async (id: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      console.log(`Validating item existence before sharing: ${id}`);
      
      // Check cache first
      const now = Date.now();
      const cachedResult = validatedItemIds[id];
      if (cachedResult && (now - cachedResult.timestamp) < CACHE_EXPIRY_MS) {
        console.log(`Using cached validation result for item ${id}: ${cachedResult.valid}`);
        return cachedResult.valid;
      }

      // Normalized ID (ensure it's a valid format)
      const trimmedId = id.trim();
      
      if (!trimmedId) {
        console.error('Invalid item ID format for sharing');
        return false;
      }
      
      // Convert to numeric ID
      const numericId = parseInt(trimmedId, 10);
      if (isNaN(numericId)) {
        console.error('Item ID is not a number:', trimmedId);
        return false;
      }
      
      // Check if the item exists with retry logic
      const result = await withRetry(
        async () => {
          console.log(`Attempt to validate item ${numericId} existence`);
          
          return await fetchWithTimeout(
            async () => {
              const { data, error } = await supabase
                .from('items')
                .select('id, title')
                .eq('id', numericId)
                .maybeSingle();
                
              if (error) {
                console.error(`Error checking item ${numericId} existence:`, error);
                throw error;
              }
              
              return { data };
            }, 
            5000 // 5 second timeout
          );
        },
        {
          maxAttempts: 2,
          initialDelay: 500,
          backoffFactor: 1.5,
          onRetry: (attempt, delay) => {
            console.log(`Retrying item validation (attempt ${attempt}) for item ${numericId} after ${delay}ms`);
          },
          onFail: () => {
            console.error(`Failed to validate item ${numericId} after all retry attempts`);
          }
        }
      );
      
      const isValid = !!result.data;
      
      // Cache the result
      validatedItemIds[id] = { timestamp: now, valid: isValid };
      
      if (!isValid) {
        console.error(`Item with ID ${numericId} not found during validation`);
        return false;
      }
      
      console.log(`Item validated successfully: ${result.data.title} (ID: ${result.data.id})`);
      return true;
      
    } catch (error) {
      const isNetworkIssue = isNetworkError(error);
      console.error(`Validation error for item ${id}:`, error, isNetworkIssue ? '(Network error)' : '');
      
      // If it's a network error, we'll assume the item exists to allow offline sharing
      if (isNetworkIssue) {
        console.log(`Network error during validation - proceeding with share for item ${id} anyway`);
        return true;
      }
      
      return false;
    } finally {
      setIsValidating(false);
    }
  }, []);

  /**
   * Generates a reliable URL for sharing an item using our share redirect path.
   * This approach is more resilient to routing changes and direct URL access.
   */
  const getShareUrl = useCallback((id: string): string => {
    try {
      // Use the dedicated share route for better deep linking support
      const sharePath = `/share/${id}`;
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${sharePath}`;
      
      console.log(`Generated share URL: ${fullUrl} for item: ${id}`);
      
      // Validate URL format
      new URL(fullUrl);
      return fullUrl;
    } catch (error) {
      console.error('Error generating share URL:', error);
      // Fallback to a simple format if there's any error
      return `${window.location.origin}/share/${id}`;
    }
  }, []);

  /**
   * Records the share event in the database for analytics.
   */
  const recordShareAnalytics = useCallback(async (id: string, shareType: string = 'general', success: boolean = true) => {
    if (!session?.user) return;
    
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return;
      
      await supabase
        .from('item_shares')
        .insert({
          item_id: numericId,
          user_id: session.user.id,
          share_type: shareType,
          success: success,
          device_type: navigator.userAgent || 'unknown',
        });
        
      console.log(`Recorded share analytics for item: ${id}`, { success, shareType });
    } catch (error) {
      console.error('Failed to record share analytics:', error);
      // Non-critical error, don't show toast to user
    }
  }, [session]);

  /**
   * Main handler for sharing an item.
   * Uses the share path strategy for reliable deep link handling.
   */
  const handleShare = useCallback(async (e?: React.MouseEvent) => {
    // Prevent any default navigation or event propagation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    console.log(`Starting share process for item: ${itemId}`);
    setIsSharing(true);
    
    try {
      if (!itemId) {
        throw new Error('Invalid item ID for sharing');
      }
      
      let isValid = true;
      
      // Only validate if we're online - allow offline sharing by skipping validation
      if (navigator.onLine) {
        // Validate the item exists before sharing, with timeout protection
        isValid = await Promise.race([
          validateItem(itemId),
          new Promise<boolean>(resolve => setTimeout(() => {
            console.log('Item validation timed out - proceeding with share anyway');
            resolve(true);
          }, 3000)) // 3 second timeout as a fallback
        ]);
      } else {
        console.log('Device appears offline - skipping validation and proceeding with share');
      }
      
      if (!isValid) {
        toast({
          title: "Cannot share item",
          description: "This item is no longer available or may have been removed.",
          variant: "destructive"
        });
        
        // Record failed share attempt
        await recordShareAnalytics(itemId, 'failed_validation', false);
        return;
      }
      
      const shareUrl = getShareUrl(itemId);
      console.log(`Attempting to share URL: ${shareUrl}`);
      
      await shareContent({
        title: 'Check out this sustainable item on PIF',
        text: 'I found this interesting eco-friendly item on PIF Community',
        url: shareUrl
      });
      
      // Record analytics regardless of share method
      await recordShareAnalytics(itemId, 'success');
      
      toast({
        title: "Shared successfully",
        description: "Link has been copied to clipboard",
      });
      
    } catch (error) {
      console.error('Unexpected error in handleShare:', error);
      toast({
        title: "Error sharing",
        description: "Something went wrong while sharing. Please try again.",
        variant: "destructive"
      });
      
      // Record failed share attempt
      await recordShareAnalytics(itemId, 'error', false);
    } finally {
      setIsSharing(false);
    }
  }, [itemId, validateItem, getShareUrl, shareContent, recordShareAnalytics, toast]);

  return {
    isSharing,
    isValidating,
    handleShare,
    isShareSupported,
    validateItem
  };
};
