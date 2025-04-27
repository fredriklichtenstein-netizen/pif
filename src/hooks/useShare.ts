
import { useState } from 'react';
import { useToast } from './use-toast';

interface ShareOptions {
  title?: string;
  text?: string;
  url: string;
}

/**
 * Hook for sharing content through various methods.
 * Provides fallbacks for when the Web Share API is unavailable or denied permissions.
 */
export function useShare() {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  /**
   * Checks if the Web Share API is available in this browser/environment.
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
   * Copies text to the clipboard with fallbacks for older browsers.
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
   * Share content using available methods, with fallbacks.
   */
  const shareContent = async (options: ShareOptions) => {
    console.log('Starting share process with options:', options);
    setIsSharing(true);
    
    try {
      // Check if we're in a secure context
      if (!isSecureContext()) {
        console.log('Not in a secure context, falling back to clipboard');
        const copied = await copyToClipboard(options.url);
        
        toast({
          title: copied ? "Link copied" : "Sharing failed",
          description: copied 
            ? "Link has been copied to clipboard" 
            : "Couldn't share or copy link. Please try again.",
          variant: copied ? "default" : "destructive",
        });
        
        setIsSharing(false);
        return;
      }
      
      // Try using the Web Share API if supported and content can be shared
      if (isShareApiSupported() && canShareContent(options)) {
        console.log('Using native Web Share API');
        
        try {
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
        } catch (error) {
          // Handle specific error types
          if ((error as Error).name === 'AbortError') {
            // User cancelled the share operation - no need for error toast
            console.log('Share operation was aborted by user');
          } else if ((error as Error).name === 'NotAllowedError') {
            console.log('Share permission denied, falling back to clipboard');
            const copied = await copyToClipboard(options.url);
            
            toast({
              title: copied ? "Link copied" : "Sharing failed",
              description: copied 
                ? "Sharing permission denied. Link has been copied to clipboard instead." 
                : "Sharing permission denied and couldn't copy link.",
              variant: copied ? "default" : "destructive",
            });
          } else {
            // Generic error handler
            console.error('Share error:', error);
            const copied = await copyToClipboard(options.url);
            
            toast({
              title: copied ? "Link copied" : "Sharing failed",
              description: copied 
                ? "Couldn't use share functionality. Link has been copied to clipboard instead." 
                : "Couldn't share or copy link. Please try again.",
              variant: copied ? "default" : "destructive",
            });
          }
        }
      } else {
        // Fallback to clipboard if Web Share API not available
        console.log('Web Share API not supported, falling back to clipboard');
        const copied = await copyToClipboard(options.url);
        
        toast({
          title: copied ? "Link copied" : "Sharing failed",
          description: copied 
            ? "Link has been copied to clipboard" 
            : "Couldn't share or copy link. Please try again.",
          variant: copied ? "default" : "destructive",
        });
      }
    } catch (error) {
      // Final fallback for any unexpected errors
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
