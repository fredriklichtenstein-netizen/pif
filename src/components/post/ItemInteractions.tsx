
import { useState } from "react";
import { ThumbsUp, MessageCircle, Heart } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { InteractionsList } from "./interactions/InteractionsList";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ConversationHandler } from "./interactions/ConversationHandler";
import { Skeleton } from "@/components/ui/skeleton";

type User = {
  id: string;
  name: string;
  avatar?: string;
};

interface ItemInteractionsProps {
  id: string;
  postedBy: {
    id?: string;
    name: string;
  };
  isLiked: boolean;
  showComments: boolean;
  isBookmarked: boolean;
  showInterest: boolean;
  isOwner?: boolean;
  commentsCount?: number;
  likesCount?: number;
  interestsCount?: number;
  likers?: User[];
  interestedUsers?: User[];
  commenters?: User[];
  onLikeToggle: () => void;
  onCommentToggle: () => void;
  onShowInterest: () => void;
  onBookmarkToggle: () => void;
  onMessage: (e: React.MouseEvent) => void;
  onShare: () => void;
  onReport: () => void;
  interactionsLoading?: boolean;
}

export function ItemInteractions({
  id,
  postedBy,
  isLiked,
  showComments,
  isBookmarked,
  showInterest,
  isOwner = false,
  commentsCount = 0,
  likesCount = 0,
  interestsCount = 0,
  likers = [],
  interestedUsers = [],
  commenters = [],
  onLikeToggle,
  onCommentToggle,
  onShowInterest,
  onBookmarkToggle,
  onMessage,
  onShare,
  onReport,
  interactionsLoading = false
}: ItemInteractionsProps) {
  const [dialogOpen, setDialogOpen] = useState(false);

  // If interactions are loading, show skeleton placeholders
  if (interactionsLoading) {
    return (
      <div className="flex flex-col space-y-2">
        <div className="flex justify-between items-center text-sm text-gray-600 px-1 py-2 border-b border-gray-200">
          <Skeleton className="h-5 w-10" />
          <Skeleton className="h-5 w-24 ml-auto" />
        </div>
        <div className="flex items-center justify-between py-[5px]">
          <Skeleton className="h-10 flex-1 mx-1" />
          <Skeleton className="h-10 flex-1 mx-1" />
          <Skeleton className="h-10 flex-1 mx-1" />
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col space-y-2">
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
          
          <div className="ml-auto flex gap-2">
            {commentsCount > 0 && (
              <button onClick={onCommentToggle} className="hover:underline">
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
      <div className="flex items-center justify-between py-[5px]">
        {/* Hide Like button for own posts but maintain the layout */}
        {isOwner ? (
          <div className="flex-1"></div>
        ) : (
          <button 
            onClick={onLikeToggle}
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
          className={`flex-1 flex items-center justify-center py-2 rounded-md ${
            showComments ? 'text-primary' : 'text-gray-600 hover:bg-gray-100'
          } transition-colors`}
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
