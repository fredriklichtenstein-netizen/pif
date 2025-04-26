
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useShare } from '@/hooks/useShare';
import { useGlobalAuth } from '@/hooks/useGlobalAuth';

export const useItemSharing = (itemId: string) => {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();
  const { shareContent } = useShare();
  const { session } = useGlobalAuth();

  const handleShare = async () => {
    setIsSharing(true);
    try {
      const baseUrl = window.location.origin;
      const itemUrl = `${baseUrl}/item/${itemId}`;

      await shareContent({
        title: 'Check out this PIF item',
        text: 'I found this interesting item on PIF Community',
        url: itemUrl
      });

      // Record the share in the database if user is authenticated
      if (session?.user) {
        const numericId = parseInt(itemId, 10);
        if (!isNaN(numericId)) {
          await supabase
            .from('item_shares')
            .insert({
              item_id: numericId,
              user_id: session.user.id,
              share_type: 'general'
            });
        }
      }

      toast({
        title: "Shared successfully",
        description: "Item has been shared",
      });

    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast({
          title: "Error sharing",
          description: "Failed to share the item. Please try again.",
          variant: "destructive"
        });
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
