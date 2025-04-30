
import { ThumbsUp, Heart, MessageCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InteractionsList } from "./interactions/InteractionsList";
import { useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@/hooks/item/useItemInteractions";

interface ItemCardActionsProps {
  id?: string | number; // Added id prop
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
  id, // Added id prop
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
      {/* Counts row, now includes Comments */}
      <div className="flex items-center justify-between text-sm text-gray-600 px-1 py-2">
        <div className="flex items-center gap-4">
          {/* Likes Count */}
          {likesCount > 0 && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-1 hover:underline" aria-label="Show likes">
                  <div className="bg-primary w-6 h-6 rounded-full flex items-center justify-center">
                    <ThumbsUp className="h-4 w-4 text-white" />
                  </div>
                  <span className="ml-1 text-base font-medium text-gray-800">{likesCount}</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2" align="start">
                <div className="max-h-[200px] overflow-y-auto space-y-2">
                  {likers.length > 0 ? (
                    likers.map(user => (
                      <div key={user.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={user.avatar} />
                          <AvatarFallback>{user.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{user.name}</span>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-2 text-gray-500">No likes yet</div>
                  )}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {/* Comments Count */}
          {commentsCount > 0 && (
            <button onClick={onCommentToggle} className="flex items-center gap-1 hover:underline" aria-label="Show comments">
              <div className="bg-muted w-6 h-6 rounded-full flex items-center justify-center">
                <MessageCircle className="h-4 w-4 text-primary" />
              </div>
              <span className="ml-1 text-base font-medium text-gray-800">{commentsCount}</span>
            </button>
          )}
        </div>

        {/* Interests Count at right, matching screenshot */}
        {interestsCount > 0 && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <button className="hover:underline text-gray-700 text-base">
                {interestsCount} {interestsCount === 1 ? 'interested' : 'interested'}
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
