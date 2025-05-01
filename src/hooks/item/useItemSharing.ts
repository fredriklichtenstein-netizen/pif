
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useShare } from '@/hooks/useShare';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

/**
 * Hook for sharing item content with enhanced error handling and validation.
 */
export const useItemSharing = (itemId: string) => {
  const [isSharing, setIsSharing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const { toast } = useToast();
  const { shareContent, isShareSupported } = useShare();
  const { session } = useGlobalAuth();

  /**
   * Validates that an item exists before sharing it
   */
  const validateItem = async (id: string): Promise<boolean> => {
    try {
      setIsValidating(true);
      console.log(`Validating item existence before sharing: ${id}`);
      
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
      
      // Check if the item exists
      const { data, error } = await supabase
        .from('items')
        .select('id, title')
        .eq('id', numericId)
        .maybeSingle();
        
      if (error) {
        console.error('Error checking item existence:', error);
        return false;
      }
      
      if (!data) {
        console.error(`Item with ID ${numericId} not found`);
        return false;
      }
      
      console.log(`Item validated successfully: ${data.title} (ID: ${data.id})`);
      return true;
      
    } catch (error) {
      console.error('Unexpected error during item validation:', error);
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Generates a reliable URL for sharing an item using our share redirect path.
   * This approach is more resilient to routing changes and direct URL access.
   */
  const getShareUrl = (id: string): string => {
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
  };

  /**
   * Records the share event in the database for analytics.
   */
  const recordShareAnalytics = async (id: string, shareType: string = 'general', success: boolean = true) => {
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
          success: success
        });
        
      console.log(`Recorded share analytics for item: ${id}`, { success });
    } catch (error) {
      console.error('Failed to record share analytics:', error);
      // Non-critical error, don't show toast to user
    }
  };

  /**
   * Main handler for sharing an item.
   * Uses the new share path strategy for better deep link handling.
   */
  const handleShare = async (e?: React.MouseEvent) => {
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
      
      // Validate the item exists before sharing
      const isValid = await validateItem(itemId);
      
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
      await recordShareAnalytics(itemId);
      
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
  };

  return {
    isSharing,
    isValidating,
    handleShare,
    isShareSupported,
    validateItem
  };
};
