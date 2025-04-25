
import { useState } from 'react';
import { useToast } from './use-toast';

interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
}

export function useShare() {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const shareContent = async (options: ShareOptions) => {
    setIsSharing(true);
    
    try {
      if (navigator.share) {
        // Use native share if available (mobile devices)
        await navigator.share({
          title: options.title || 'Check out this item on PIF',
          text: options.text || 'I found this item on PIF Community that might interest you',
          url: options.url,
        });
        
        toast({
          title: "Shared successfully",
          description: "Content has been shared",
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(options.url);
        
        toast({
          title: "Link copied",
          description: "Link has been copied to clipboard",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Error sharing:', error);
        toast({
          title: "Sharing failed",
          description: "Unable to share content",
          variant: "destructive",
        });
      }
    } finally {
      setIsSharing(false);
    }
  };
  
  return {
    isSharing,
    shareContent,
  };
}
