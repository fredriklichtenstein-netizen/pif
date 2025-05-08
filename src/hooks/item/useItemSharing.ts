
import { useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useShare } from '@/hooks/useShare';

export const useItemSharing = (itemId: string) => {
  const { toast } = useToast();
  const { shareContent, isSharing } = useShare();
  
  const handleShare = useCallback(async (e?: React.MouseEvent) => {
    // Prevent any default navigation
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      const shareUrl = `${window.location.origin}/item/${itemId}`;
      
      await shareContent({
        title: 'Check out this sustainable item on PIF',
        text: 'I found this interesting eco-friendly item on PIF Community',
        url: shareUrl
      });
      
      toast({
        title: "Shared successfully",
        description: "Link has been copied to clipboard",
      });
    } catch (error) {
      console.error('Error sharing:', error);
      toast({
        title: "Error sharing",
        description: "Something went wrong while sharing. Please try again.",
        variant: "destructive"
      });
    }
  }, [itemId, shareContent, toast]);

  return {
    isSharing,
    handleShare
  };
};
