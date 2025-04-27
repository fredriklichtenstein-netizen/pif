
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
    console.log('Starting share process with options:', options);
    setIsSharing(true);
    
    try {
      if (navigator.share) {
        console.log('Native share API available, attempting to share...');
        await navigator.share({
          title: options.title || 'Check out this item on PIF',
          text: options.text || 'I found this item on PIF Community that might interest you',
          url: options.url,
        });
        
        console.log('Native share successful');
        toast({
          title: "Shared successfully",
          description: "Content has been shared",
        });
      } else {
        console.log('No native share API, falling back to clipboard...');
        await navigator.clipboard.writeText(options.url);
        
        console.log('URL copied to clipboard');
        toast({
          title: "Link copied",
          description: "Link has been copied to clipboard",
        });
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('Share error:', error);
        toast({
          title: "Sharing failed",
          description: error instanceof Error ? error.message : "Unable to share content",
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
