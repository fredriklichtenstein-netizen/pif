
import { useState, useEffect } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Share, Facebook, Twitter, Mail, Link2 } from "lucide-react";
import { useShare } from "@/hooks/useShare";
import { useToast } from "@/hooks/use-toast";

interface ShareButtonProps {
  title: string;
  url: string;
  message?: string;
  compact?: boolean;
}

export function ShareButton({ title, url, message = "", compact = false }: ShareButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { shareContent, isSharing } = useShare();
  const { toast } = useToast();
  const [shareCount, setShareCount] = useState(0);
  
  // In a real app, this would fetch the share count from the server
  useEffect(() => {
    // Mock share count - in reality this would be fetched from your backend
    setShareCount(Math.floor(Math.random() * 5));
  }, []);
  
  const handleNativeShare = async () => {
    await shareContent({ title, text: message, url });
    setIsOpen(false);
    // In a real app, this would increment the share count on the server
    setShareCount(prev => prev + 1);
  };
  
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied", description: "Link has been copied to clipboard" });
      setIsOpen(false);
      // In a real app, this would increment the share count on the server
      setShareCount(prev => prev + 1);
    } catch (error) {
      toast({ 
        title: "Failed to copy link", 
        description: "Please try another sharing method",
        variant: "destructive" 
      });
    }
  };
  
  const handleShareTo = (platform: string) => {
    let shareUrl = "";
    
    switch (platform) {
      case "facebook":
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
        break;
      case "twitter":
        shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`;
        break;
      case "email":
        shareUrl = `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${message} ${url}`)}`;
        break;
      default:
        return;
    }
    
    window.open(shareUrl, "_blank");
    setIsOpen(false);
    // In a real app, this would increment the share count on the server
    setShareCount(prev => prev + 1);
  };

  if (compact) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="flex flex-col items-center gap-1 h-auto py-2 px-3 hover:bg-transparent text-gray-600 hover:text-primary"
        onClick={handleNativeShare}
      >
        <Share className="h-5 w-5" />
        <span className="text-xs font-medium">Share</span>
        {shareCount > 0 && <span className="text-xs">{shareCount}</span>}
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
          disabled={isSharing}
        >
          <Share className="h-4 w-4" />
          Share
          {shareCount > 0 && (
            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
              {shareCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3">
        <h3 className="font-medium mb-2">Share this item</h3>
        <div className="grid grid-cols-4 gap-2 mb-2">
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center h-16 p-1"
            onClick={() => handleShareTo("facebook")}
          >
            <Facebook className="h-6 w-6 mb-1 text-blue-600" />
            <span className="text-xs">Facebook</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center h-16 p-1"
            onClick={() => handleShareTo("twitter")}
          >
            <Twitter className="h-6 w-6 mb-1 text-sky-500" />
            <span className="text-xs">Twitter</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center h-16 p-1"
            onClick={() => handleShareTo("email")}
          >
            <Mail className="h-6 w-6 mb-1 text-gray-600" />
            <span className="text-xs">Email</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex flex-col items-center h-16 p-1"
            onClick={handleCopyLink}
          >
            <Link2 className="h-6 w-6 mb-1 text-purple-500" />
            <span className="text-xs">Copy</span>
          </Button>
        </div>
        <Button 
          className="w-full mt-2" 
          size="sm"
          onClick={handleNativeShare}
        >
          Share now
        </Button>
      </PopoverContent>
    </Popover>
  );
}
