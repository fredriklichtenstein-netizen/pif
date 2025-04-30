
import { useState } from 'react';
import { useToast } from './use-toast';

interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
}

/**
 * Hook for sharing content through various methods,
 * prioritizing clipboard functionality for reliability.
 */
export function useShare() {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  /**
   * Copies text to the clipboard with fallbacks for older browsers.
   * This is our primary sharing method for maximum reliability.
   */
  const copyToClipboard = async (text: string): Promise<boolean> => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        return successful;
      }
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      return false;
    }
  };

  /**
   * Checks if the Web Share API is available in this browser/environment.
   * Used as a secondary sharing method when available.
   */
  const isShareApiSupported = () => {
    return typeof navigator !== 'undefined' && 
           !!navigator.share &&
           !!navigator.canShare;
  };

  /**
   * Checks if we're in a secure context (needed for Web Share API).
   */
  const isSecureContext = () => {
    return typeof window !== 'undefined' && window.isSecureContext === true;
  };

  /**
   * Checks if the provided content can be shared using the Web Share API.
   */
  const canShareContent = (options: ShareOptions) => {
    if (!isShareApiSupported()) return false;
    try {
      return navigator.canShare({
        title: options.title,
        text: options.text,
        url: options.url
      });
    } catch (error) {
      console.log('Error checking if content can be shared:', error);
      return false;
    }
  };

  /**
   * Attempts to share using the Web Share API.
   * Returns true if successful, false otherwise.
   */
  const attemptWebShare = async (options: ShareOptions): Promise<boolean> => {
    if (!isSecureContext() || !isShareApiSupported() || !canShareContent(options)) {
      return false;
    }

    try {
      await navigator.share({
        title: options.title || 'Check out this item on PIF',
        text: options.text || 'I found this item on PIF Community that might interest you',
        url: options.url,
      });
      return true;
    } catch (error) {
      // If it's an AbortError, the user cancelled, which is not a failure
      if ((error as Error).name === 'AbortError') {
        console.log('Share operation was aborted by user');
        return true;
      }
      console.error('Web Share API error:', error);
      return false;
    }
  };

  /**
   * Share content prioritizing clipboard functionality with Web Share API as fallback.
   */
  const shareContent = async (options: ShareOptions) => {
    console.log('Starting share process with options:', options);
    setIsSharing(true);
    
    try {
      // Validate URL before attempting to share
      if (!options.url || !options.url.trim()) {
        throw new Error('No valid URL provided for sharing');
      }

      // First attempt: Copy to clipboard (most reliable across all platforms)
      const copied = await copyToClipboard(options.url);
      
      if (copied) {
        toast({
          title: "Link copied",
          description: "Link has been copied to clipboard",
        });
        
        // As an enhancement, also try Web Share API if available
        // This doesn't affect our primary success path
        if (isSecureContext() && isShareApiSupported() && canShareContent(options)) {
          attemptWebShare(options)
            .then(success => {
              if (success) {
                console.log('Also shared via Web Share API');
              }
            })
            .catch(err => {
              console.log('Web Share API attempt failed after clipboard success:', err);
              // We don't show errors here since clipboard already worked
            });
        }
        
        return;
      }
      
      // Second attempt: If clipboard fails, try Web Share API
      const webShareSucceeded = await attemptWebShare(options);
      
      if (webShareSucceeded) {
        toast({
          title: "Shared successfully",
          description: "Content has been shared",
        });
        return;
      }
      
      // If both methods fail
      toast({
        title: "Sharing failed",
        description: "Couldn't share content. Please try copying the URL manually.",
        variant: "destructive",
      });
      
    } catch (error) {
      console.error('Unexpected error during share process:', error);
      toast({
        title: "Sharing failed",
        description: error instanceof Error ? error.message : "Unable to share content",
        variant: "destructive",
      });
    } finally {
      setIsSharing(false);
    }
  };
  
  return {
    isSharing,
    shareContent,
    isShareSupported: isShareApiSupported() && isSecureContext()
  };
}
