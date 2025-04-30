
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useShare } from '@/hooks/useShare';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

/**
 * Hook for sharing item content with enhanced error handling and analytics.
 */
export const useItemSharing = (itemId: string) => {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { shareContent, isShareSupported } = useShare();
  const { session } = useGlobalAuth();

  /**
   * Generates the appropriate URL for sharing an item.
   * Uses the current origin to handle different environments.
   */
  const getShareUrl = (id: string): string => {
    const baseUrl = window.location.origin;
    const itemUrl = `${baseUrl}/item/${id}`;
    console.log(`Generated share URL: ${itemUrl} for item: ${id}`);
    return itemUrl;
  };

  /**
   * Records the share event in the database for analytics.
   */
  const recordShareAnalytics = async (id: string, shareType: string = 'general') => {
    if (!session?.user) return;
    
    try {
      const numericId = parseInt(id, 10);
      if (isNaN(numericId)) return;
      
      await supabase
        .from('item_shares')
        .insert({
          item_id: numericId,
          user_id: session.user.id,
          share_type: shareType
        });
        
      console.log(`Recorded share analytics for item: ${id}`);
    } catch (error) {
      console.error('Failed to record share analytics:', error);
      // Non-critical error, don't show toast to user
    }
  };

  /**
   * Main handler for sharing an item.
   * Provides appropriate fallbacks and error handling.
   */
  const handleShare = async () => {
    console.log(`Starting share process for item: ${itemId}`);
    setIsSharing(true);
    
    try {
      const shareUrl = getShareUrl(itemId);
      
      await shareContent({
        title: 'Check out this PIF item',
        text: 'I found this interesting item on PIF Community',
        url: shareUrl
      });
      
      // Record analytics regardless of share method
      await recordShareAnalytics(itemId);
      
    } catch (error) {
      // This catch block should only trigger for truly unexpected errors
      // since most errors are handled within the shareContent function
      console.error('Unexpected error in handleShare:', error);
      toast({
        title: "Error sharing",
        description: "Something went wrong while sharing. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSharing(false);
    }
  };

  return {
    isSharing,
    handleShare,
    isShareSupported
  };
};
