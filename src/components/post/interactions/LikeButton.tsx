
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
import { FollowButton } from "./FollowButton";

type User = {
  id: string;
  name: string;
  avatar?: string;
};

interface LikeButtonProps {
  isLiked: boolean;
  onLikeToggle: () => void;
  likesCount?: number;
  likers?: User[];
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
  
  const handleLikeClick = () => {
    if (!disabled) {
      onLikeToggle();
    }
  };
  
  const handleLikersClick = (e: React.MouseEvent) => {
    if (likesCount === 0) return;
    e.stopPropagation();
    setShowDetailedPopover(!showDetailedPopover);
  };
  
  return (
    <div className="flex items-center">
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button 
              onClick={handleLikeClick}
              className={`flex items-center ${
                isLiked ? 'text-primary' : 'text-gray-500 hover:text-gray-700'
              } transition-colors ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              disabled={disabled}
              aria-label={isLiked ? "Unlike" : "Like"}
            >
              <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs p-2">
            <p>{isLiked ? "Unlike" : "Like"}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      {likesCount > 0 && (
        <Popover open={showDetailedPopover} onOpenChange={setShowDetailedPopover}>
          <PopoverTrigger asChild>
            <button 
              onClick={handleLikersClick}
              className="text-xs font-medium ml-1 cursor-pointer"
              aria-label="Show likers"
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-pointer">{likesCount}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs p-2">
                    <p>{`${likesCount} ${likesCount === 1 ? 'like' : 'likes'}`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </button>
          </PopoverTrigger>
          
          {likers.length > 0 && (
            <PopoverContent className="w-80 p-0 bg-white rounded-lg shadow-lg z-50" side="top">
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
                    <FollowButton userId={liker.id} />
                  </div>
                ))}
              </div>
            </PopoverContent>
          )}
        </Popover>
      )}
    </div>
  );
}
