
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useShare } from '@/hooks/useShare';

export const useItemSharing = (itemId: string) => {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { shareContent } = useShare();

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const url = window.location.href;
      await shareContent({
        title: 'Check out this PIF item',
        text: 'I found this interesting item on PIF Community',
        url
      });

      // Record the share in the database
      // Convert string itemId to number for the database
      const numericId = parseInt(itemId, 10);
      if (!isNaN(numericId)) {
        await supabase
          .from('item_shares')
          .insert({
            item_id: numericId,
            share_type: 'general'
          });
      }

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
      }
    } finally {
      setIsSharing(false);
    }
  };

  return {
    isSharing,
    handleShare
  };
};
