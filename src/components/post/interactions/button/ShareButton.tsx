
import { useState, useCallback, useEffect } from "react";
import { Share } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ShareButtonProps {
  itemId: string;
  onShareClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  className?: string;
}

export const ShareButton = ({ 
  itemId, 
  onShareClick, 
  disabled = false, 
  className = "" 
}: ShareButtonProps) => {
  const [shareAttempted, setShareAttempted] = useState(false);
  const [shareInProgress, setShareInProgress] = useState(false);
  const [shareSuccess, setShareSuccess] = useState(false);
  const [clickCount, setClickCount] = useState(0);
  
  // Reset share success status after a delay
  useEffect(() => {
    if (shareSuccess) {
      const timer = setTimeout(() => {
        setShareSuccess(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [shareSuccess]);
  
  // Create memoized share handler to prevent unnecessary re-renders and ensure stability
  const handleShareClick = useCallback((e: React.MouseEvent) => {
    // Comprehensive event prevention
    e.preventDefault();
    e.stopPropagation();
    
    if (e.nativeEvent) {
      e.nativeEvent.stopImmediatePropagation();
      e.nativeEvent.preventDefault();
    }
    
    if (shareInProgress) {
      console.log(`[SHARE] Share already in progress for item: ${itemId}, ignoring click`);
      return;
    }
    
    // Protection against double-clicks
    setClickCount(prev => prev + 1);
    if (clickCount > 0) {
      console.log(`[SHARE] Detected multiple rapid clicks (${clickCount + 1}), debouncing`);
      setTimeout(() => setClickCount(0), 500);
      return;
    }
    
    // Add debug breadcrumb
    console.log(`[SHARE] Button click detected for item: ${itemId}`);
    
    try {
      // Set states to track share attempt
      setShareAttempted(true);
      setShareInProgress(true);
      setShareSuccess(false);
      
      // Invoke share handler from props
      console.log(`[SHARE] Invoking share callback for item: ${itemId}`);
      
      // Execute share with timeout protection
      const sharePromise = Promise.resolve(onShareClick(e));
      
      // Create a timeout promise
      const timeoutPromise = new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error('Share operation timed out after 5 seconds'));
        }, 5000);
      });
      
      // Race the share operation against the timeout
      Promise.race([sharePromise, timeoutPromise])
        .then(() => {
          console.log(`[SHARE] Share operation completed successfully for item: ${itemId}`);
          setShareSuccess(true);
        })
        .catch((error) => {
          console.error(`[SHARE] Share operation failed for item: ${itemId}:`, error);
        })
        .finally(() => {
          console.log(`[SHARE] Share operation finalized for item: ${itemId}`);
          setShareInProgress(false);
        });
    } catch (error) {
      console.error("[SHARE] Error in share handler:", error);
      setShareInProgress(false);
    }
    
    // Reset click counter after a delay
    setTimeout(() => setClickCount(0), 500);
    
    // Explicitly return false to prevent any default behavior
    return false;
  }, [itemId, onShareClick, shareInProgress, clickCount]);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            className={`relative flex flex-col items-center ${className}`}
            role="button" 
            tabIndex={0}
            onClick={handleShareClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleShareClick(e as unknown as React.MouseEvent);
              }
            }}
            data-testid={`share-button-${itemId}`}
            aria-busy={shareInProgress}
          >
            <button 
              type="button"
              aria-label="Share"
              className={`flex flex-col items-center rounded cursor-pointer w-full ${
                shareInProgress ? 'opacity-70 pointer-events-none' : ''
              } ${shareSuccess ? 'text-green-600' : ''}`}
              disabled={shareInProgress || disabled}
              onClick={handleShareClick}
            >
              <div className="flex items-center justify-center h-7">
                <Share 
                  className={`w-6 h-6 flex-shrink-0 
                    ${shareInProgress ? 'animate-pulse text-primary' : ''}
                    ${shareSuccess ? 'text-green-600' : ''}
                  `} 
                  stroke={shareSuccess ? "#16a34a" : "#333333"} 
                  strokeWidth={2} 
                />
              </div>
              <div className="flex flex-row items-center justify-center mt-1">
                <span className="text-xs font-medium select-none">
                  {shareInProgress ? "Sharing..." : shareSuccess ? "Shared!" : "Share"}
                </span>
              </div>
            </button>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="center" className="bg-black text-white text-xs p-2">
          {shareInProgress ? 
            "Sharing in progress..." :
            shareSuccess ? 
              "Successfully shared!" :
              shareAttempted ? 
                "Link will be copied to clipboard" : 
                "Share this item"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
