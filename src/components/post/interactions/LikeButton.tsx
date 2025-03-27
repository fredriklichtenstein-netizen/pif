
import { Heart } from "lucide-react";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

type Liker = {
  id: string;
  name: string;
  avatar?: string;
};

interface LikeButtonProps {
  isLiked: boolean;
  onLikeToggle: () => void;
  likesCount?: number;
  likers?: Liker[];
  disabled?: boolean;
}

export function LikeButton({ 
  isLiked, 
  onLikeToggle, 
  likesCount = 0,
  likers = [],
  disabled = false
}: LikeButtonProps) {
  const [showDetailedPopover, setShowDetailedPopover] = useState(false);
  
  const handleLikeClick = (e: React.MouseEvent) => {
    if (disabled) return;
    onLikeToggle();
  };
  
  const handleLikersClick = (e: React.MouseEvent) => {
    if (disabled || likesCount === 0) return;
    e.stopPropagation();
    setShowDetailedPopover(!showDetailedPopover);
  };
  
  return (
    <TooltipProvider delayDuration={300}>
      <Popover open={showDetailedPopover} onOpenChange={setShowDetailedPopover}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleLikeClick}
              className={`flex items-center space-x-1 ${isLiked ? 'text-primary' : 'text-gray-500'} hover:text-gray-700 transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              aria-label={isLiked ? "Unlike" : "Like"}
              disabled={disabled}
            >
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor" 
                strokeWidth="2" 
                className="h-5 w-5"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
            </button>
          </TooltipTrigger>
          
          <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs p-2">
            <p>{isLiked ? "Unlike" : "Like"}</p>
          </TooltipContent>
        </Tooltip>
        
        {likesCount > 0 && (
          <PopoverTrigger asChild>
            <button 
              onClick={handleLikersClick}
              className="text-xs font-medium ml-1"
              aria-label="Show likers"
            >
              {likesCount}
            </button>
          </PopoverTrigger>
        )}
        
        {likers.length > 0 && !disabled && (
          <PopoverContent className="w-80 p-0 bg-white rounded-lg shadow-lg" side="top">
            <div className="p-3 font-medium border-b">
              <h3>Likes ({likesCount})</h3>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {likers.map((liker) => (
                <div key={liker.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={liker.avatar} />
                      <AvatarFallback>{liker.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{liker.name}</span>
                  </div>
                  <Button variant="outline" size="sm" className="text-xs">
                    Follow
                  </Button>
                </div>
              ))}
            </div>
          </PopoverContent>
        )}
      </Popover>
    </TooltipProvider>
  );
}
