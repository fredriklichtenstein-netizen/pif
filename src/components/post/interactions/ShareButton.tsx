
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Share, Link2, Copy, Check } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  url: string;
  message?: string;
  compact?: boolean;
  onShareComplete?: () => void;
}

export function ShareButton({ 
  title, 
  url, 
  message = "", 
  compact = false,
  onShareComplete
}: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { shareContent, isSharing, isShareSupported } = useShare();
  const { toast } = useToast();
  
  // Reset copy state when popover closes
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      setTimeout(() => setIsCopied(false), 300);
    }
  };
  
  const handleShare = async () => {
    await shareContent({ title, text: message, url });
    setIsOpen(false);
    if (onShareComplete) {
      onShareComplete();
    }
  };
  
  const handleCopyLink = async () => {
    try {
      const { navigator } = window;
      
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
        setIsCopied(true);
        toast({ title: "Link copied", description: "Link has been copied to clipboard" });
        
        // Close popover after a brief delay
        setTimeout(() => {
          setIsOpen(false);
          if (onShareComplete) {
            onShareComplete();
          }
        }, 1000);
      } else {
        // Fallback for browsers without clipboard API
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setIsCopied(true);
          toast({ title: "Link copied", description: "Link has been copied to clipboard" });
          setTimeout(() => setIsOpen(false), 1000);
        } else {
          toast({ 
            title: "Failed to copy link", 
            description: "Please try another sharing method",
            variant: "destructive" 
          });
        }
      }
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({ 
        title: "Failed to copy link", 
        description: "Please try another sharing method",
        variant: "destructive" 
      });
    }
  };

  // Compact button for mobile or space-constrained UIs
  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-transparent text-gray-600 hover:text-primary"
        onClick={handleShare}
        disabled={isSharing}
      >
        <Share className="h-5 w-5" />
        <span className="text-xs font-medium">Share</span>
      </Button>
    );
  }

  // Full sharing popover for desktop
  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isSharing}
        >
          <Share className="h-4 w-4" />
          Share
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-4">
        <h3 className="font-medium mb-3 text-center">Share this item</h3>
        
        {isShareSupported && (
          <Button 
            className="w-full mb-4 flex items-center justify-center gap-2" 
            onClick={handleShare}
          >
            <Share className="h-4 w-4" />
            Share using device options
          </Button>
        )}
        
        <div className="flex items-center rounded-md border overflow-hidden">
          <div className="bg-muted py-2 px-3 flex-grow text-sm truncate">
            {url}
          </div>
          <Button 
            variant="ghost" 
            className="h-full rounded-l-none px-3 hover:bg-muted-foreground/10"
            onClick={handleCopyLink}
          >
            {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground mt-3 text-center">
          {isShareSupported ? 
            "Share with friends or copy the link directly" : 
            "Copy the link to share this item"}
        </p>
      </PopoverContent>
    </Popover>
  );
}
