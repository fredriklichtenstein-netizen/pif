
import { ThumbsUp, MessageCircle, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InteractionsList } from "./interactions/InteractionsList";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
      <div className="flex items-center justify-between text-sm text-gray-600 px-1 py-2">
        <div className="flex items-center gap-2">
          {likesCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:underline">
                  {likesCount} {likesCount === 1 ? 'like' : 'likes'}
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
          
          {commentsCount > 0 && (
            <button onClick={onCommentToggle} className="hover:underline">
              {commentsCount} {commentsCount === 1 ? 'comment' : 'comments'}
            </button>
          )}
          
          {interestsCount > 0 && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button className="hover:underline">
                  {interestsCount} {interestsCount === 1 ? 'person' : 'people'} interested
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
      
      {/* Action buttons row with labels */}
      <div className="flex items-center justify-around border-t border-gray-200 py-1">
        {!isOwner && (
          <button 
            onClick={onLike}
            className={`flex-1 flex flex-col items-center py-2 ${
              isLiked ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <ThumbsUp className={`h-5 w-5 mb-1 ${isLiked ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">Like</span>
          </button>
        )}
        
        <button 
          onClick={onCommentToggle}
          className="flex-1 flex flex-col items-center py-2 text-gray-600 hover:text-gray-900"
        >
          <MessageCircle className="h-5 w-5 mb-1" />
          <span className="text-xs font-medium">Comment</span>
        </button>
        
        {!isOwner && (
          <button 
            onClick={onShowInterest}
            className={`flex-1 flex flex-col items-center py-2 ${
              showInterest ? 'text-primary' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className={`h-5 w-5 mb-1 ${showInterest ? 'fill-current' : ''}`} />
            <span className="text-xs font-medium">Show Interest</span>
          </button>
        )}
      </div>
    </div>
  );
}
