
import { MessageCircle } from "lucide-react";
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

type Commenter = {
  id: string;
  name: string;
  avatar?: string;
};

interface CommentButtonProps {
  onCommentToggle: () => void;
  commentsCount?: number;
  commenters?: Commenter[];
}

export function CommentButton({ 
  onCommentToggle, 
  commentsCount = 0, 
  commenters = [] 
}: CommentButtonProps) {
  const [showDetailedPopover, setShowDetailedPopover] = useState(false);
  
  const handleCommentClick = () => {
    onCommentToggle();
  };
  
  const handleCommentersClick = (e: React.MouseEvent) => {
    if (commentsCount === 0) return;
    e.stopPropagation();
    setShowDetailedPopover(!showDetailedPopover);
  };
  
  return (
    <div className="flex items-center">
      <button 
        onClick={handleCommentClick}
        className="flex items-center text-gray-500 hover:text-gray-700 transition-colors"
        aria-label="Toggle comments"
      >
        <MessageCircle className="h-5 w-5" />
      </button>
      
      {commentsCount > 0 && (
        <Popover open={showDetailedPopover} onOpenChange={setShowDetailedPopover}>
          <PopoverTrigger asChild>
            <button 
              onClick={handleCommentersClick}
              className="text-xs font-medium ml-1"
              aria-label="Show commenters"
            >
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span>{commentsCount}</span>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="bg-black/75 text-white border-none text-xs p-2">
                    <p>{`${commentsCount} ${commentsCount === 1 ? 'comment' : 'comments'}`}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </button>
          </PopoverTrigger>
          
          {commenters.length > 0 && (
            <PopoverContent className="w-80 p-0 bg-white rounded-lg shadow-lg" side="top">
              <div className="p-3 font-medium border-b">
                <h3>Comments ({commentsCount})</h3>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {commenters.map((commenter) => (
                  <div key={commenter.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={commenter.avatar} />
                        <AvatarFallback>{commenter.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{commenter.name}</span>
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
      )}
    </div>
  );
}
