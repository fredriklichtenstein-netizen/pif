
import { ThumbsUp, MessageCircle, Heart } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { InteractionsList } from "./interactions/InteractionsList";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Card } from "@/components/ui/card";
import type { User } from "@/hooks/item/useItemInteractions";

interface ItemCardActionsProps {
  isLiked: boolean;
  likesCount?: number;
  commentsCount?: number;
  showInterest: boolean;
  interestsCount?: number;
  isOwner: boolean;
  likers?: User[];
  interestedUsers?: User[];
  onLike: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onShare?: () => void;
}

export function ItemCardActions({
  isLiked,
  likesCount = 0,
  commentsCount = 0,
  showInterest,
  interestsCount = 0,
  isOwner,
  likers = [],
  interestedUsers = [],
  onLike,
  onCommentToggle,
  onShowInterest
}: ItemCardActionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  
  return (
    <div className="w-full flex flex-col">
      {/* Counts row */}
      {(likesCount > 0 || commentsCount > 0 || interestsCount > 0) && (
        <div className="flex justify-between items-center text-sm text-gray-600 px-1 py-2 border-b border-gray-200">
          {likesCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:underline">
                  <div className="bg-primary w-5 h-5 rounded-full flex items-center justify-center">
                    <ThumbsUp className="h-3 w-3 text-white" />
                  </div>
                  <span>{likesCount}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {likers.map(user => (
                    <div key={user.id} className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{user.name}</span>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
          
          <div className="ml-auto flex gap-2">
            {commentsCount > 0 && (
              <button 
                onClick={onCommentToggle}
                className="hover:underline"
              >
                {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
              </button>
            )}
            
            {interestsCount > 0 && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <button className="hover:underline">
                    {interestsCount} interested
                  </button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>People Interested</DialogTitle>
                  </DialogHeader>
                  <InteractionsList interested={interestedUsers} />
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>
      )}
      
      {/* Action buttons row */}
      <div className="flex items-center justify-between border-b border-gray-200 py-1">
        {/* Hide Like button for own posts but maintain the layout */}
        {isOwner ? (
          <div className="flex-1"></div>
        ) : (
          <button 
            onClick={onLike}
            className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
              isLiked ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 mr-2 ${isLiked ? 'fill-primary' : ''}`} />
            <span className="font-medium">Like</span>
          </button>
        )}
        
        <button 
          onClick={onCommentToggle}
          className="flex-1 flex items-center justify-center py-2 rounded-md text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <MessageCircle className="h-5 w-5 mr-2" />
          <span className="font-medium">Comment</span>
        </button>
        
        {/* Hide Interest button for own posts but maintain the layout */}
        {isOwner ? (
          <div className="flex-1"></div>
        ) : (
          <button 
            onClick={onShowInterest}
            className={`flex-1 flex items-center justify-center py-2 rounded-md transition-colors ${
              showInterest ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Heart className={`h-5 w-5 mr-2 ${showInterest ? 'fill-primary' : ''}`} />
            <span className="font-medium">{showInterest ? 'Interested' : 'Interest'}</span>
          </button>
        )}
      </div>
    </div>
  );
}
